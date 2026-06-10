package com.example.tracker.controller;

import com.example.tracker.dto.ExpenseRequest;
import com.example.tracker.repository.UserRepository;
import com.example.tracker.service.ExpenseService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/receipt")
@RequiredArgsConstructor
public class ReceiptController {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final ExpenseService expenseService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private Long getUserId(Authentication auth) {
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found")).getId();
    }

    @PostMapping("/scan")
    public ResponseEntity<?> scanReceipt(@RequestBody Map<String, String> body,
                                         Authentication auth) {
        String base64Image = body.get("image");
        String mediaType = body.getOrDefault("mediaType", "image/jpeg");

        if (base64Image == null || base64Image.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No image provided"));
        }

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            System.err.println("[ReceiptController] GEMINI_API_KEY is empty! Set it in .env file.");
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Gemini API key is not configured. Set GEMINI_API_KEY in your .env file."));
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> imageData = new HashMap<>();
            imageData.put("mime_type", mediaType);
            imageData.put("data", base64Image);

            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("inline_data", imageData);

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text",
                    "Analyze this receipt and extract information. " +
                            "Respond ONLY with a valid JSON object, no markdown, no extra text. " +
                            "Example format: {\"amount\": 605, \"category\": \"Food\", " +
                            "\"description\": \"Cafe Mumbai\", \"date\": \"2026-03-11\", " +
                            "\"items\": \"Chai, Sandwich\", \"confidence\": \"high\"}. " +
                            "Category must be one of: Food, Transport, Shopping, Entertainment, Bills, Education, Other. " +
                            "Date must be in YYYY-MM-DD format. Use today's date if not visible."
            );

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(inlineData, textPart));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            System.out.println("[ReceiptController] Sending image to Gemini API...");
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            String responseStr = response.getBody();
            System.out.println("[ReceiptController] Gemini raw response: " + (responseStr != null ? responseStr.substring(0, Math.min(responseStr.length(), 500)) : "null"));

            if (responseStr == null || responseStr.isBlank()) {
                return ResponseEntity.status(500).body(Map.of("error", "Gemini returned empty response"));
            }

            // Parse the Gemini response JSON safely
            Map<String, Object> responseBody = objectMapper.readValue(responseStr, new TypeReference<>() {});

            // Check for API-level errors
            if (responseBody.containsKey("error")) {
                Map<?, ?> errorObj = (Map<?, ?>) responseBody.get("error");
                String errorMsg = errorObj != null ? String.valueOf(errorObj.get("message")) : "Unknown Gemini API error";
                System.err.println("[ReceiptController] Gemini API error: " + errorMsg);
                return ResponseEntity.status(500).body(Map.of("error", "Gemini API error: " + errorMsg));
            }

            // Navigate: candidates[0].content.parts[0].text
            List<?> candidates = (List<?>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                // Check if content was blocked
                Object promptFeedback = responseBody.get("promptFeedback");
                String detail = promptFeedback != null ? promptFeedback.toString() : "No candidates returned";
                System.err.println("[ReceiptController] No candidates: " + detail);
                return ResponseEntity.status(500).body(Map.of("error", "AI could not read the receipt. " + detail));
            }

            Map<?, ?> firstCandidate = (Map<?, ?>) candidates.get(0);
            if (firstCandidate == null) {
                return ResponseEntity.status(500).body(Map.of("error", "Empty candidate in AI response"));
            }

            // Check if candidate was blocked
            Object finishReason = firstCandidate.get("finishReason");
            if ("SAFETY".equals(finishReason) || "BLOCKED".equals(finishReason)) {
                return ResponseEntity.status(500).body(Map.of("error", "AI blocked the content for safety reasons. Try a clearer receipt image."));
            }

            Map<?, ?> contentMap = (Map<?, ?>) firstCandidate.get("content");
            if (contentMap == null) {
                return ResponseEntity.status(500).body(Map.of("error", "No content in AI response"));
            }

            List<?> parts = (List<?>) contentMap.get("parts");
            if (parts == null || parts.isEmpty()) {
                return ResponseEntity.status(500).body(Map.of("error", "No parts in AI response"));
            }

            Map<?, ?> firstPart = (Map<?, ?>) parts.get(0);
            String rawText = (String) firstPart.get("text");

            if (rawText == null || rawText.isBlank()) {
                return ResponseEntity.status(500).body(Map.of("error", "AI returned empty text"));
            }

            System.out.println("[ReceiptController] Raw AI text: " + rawText);

            // Clean markdown fences — Gemini often wraps JSON in ```json ... ```
            String cleanJson = rawText.trim();
            if (cleanJson.startsWith("```")) {
                // Remove opening fence (```json or ```)
                int firstNewline = cleanJson.indexOf('\n');
                if (firstNewline != -1) {
                    cleanJson = cleanJson.substring(firstNewline + 1);
                }
                // Remove closing fence
                int lastFence = cleanJson.lastIndexOf("```");
                if (lastFence != -1) {
                    cleanJson = cleanJson.substring(0, lastFence);
                }
                cleanJson = cleanJson.trim();
            }

            // Validate it's actually valid JSON by parsing it
            try {
                objectMapper.readValue(cleanJson, new TypeReference<Map<String, Object>>() {});
            } catch (Exception parseErr) {
                System.err.println("[ReceiptController] Failed to parse cleaned JSON: " + cleanJson);
                return ResponseEntity.status(500).body(Map.of(
                        "error", "AI response was not valid JSON",
                        "rawText", rawText
                ));
            }

            Map<String, String> result = new HashMap<>();
            result.put("result", cleanJson);
            System.out.println("[ReceiptController] Scan successful, returning: " + cleanJson);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("[ReceiptController] Scan exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Scan failed: " + e.getMessage()));
        }
    }

    @PostMapping("/scan-and-save")
    public ResponseEntity<?> scanAndSave(@RequestBody Map<String, String> body,
                                         Authentication auth) {
        ResponseEntity<?> scanResult = scanReceipt(body, auth);
        if (!scanResult.getStatusCode().is2xxSuccessful()) {
            return scanResult;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, String> resultMap = (Map<String, String>) scanResult.getBody();
            String jsonStr = resultMap.get("result");

            Map<String, Object> parsed = objectMapper.readValue(jsonStr, new TypeReference<>() {});

            double amount = 0.0;
            Object amountObj = parsed.get("amount");
            if (amountObj instanceof Number) {
                amount = ((Number) amountObj).doubleValue();
            } else if (amountObj instanceof String) {
                amount = Double.parseDouble(((String) amountObj).replaceAll("[^0-9.]", ""));
            }

            String category = String.valueOf(parsed.getOrDefault("category", "Other"));
            String description = String.valueOf(parsed.getOrDefault("description", "Receipt scan"));
            String date = String.valueOf(parsed.getOrDefault("date", LocalDate.now().toString()));

            ExpenseRequest expenseRequest = new ExpenseRequest();
            expenseRequest.setAmount(amount);
            expenseRequest.setCategory(category.isEmpty() ? "Other" : category);
            expenseRequest.setDescription(description.isEmpty() ? "Receipt scan" : description);
            try {
                expenseRequest.setDate(LocalDate.parse(date));
            } catch (Exception e) {
                expenseRequest.setDate(LocalDate.now());
            }

            Long userId = getUserId(auth);
            expenseService.addExpense(userId, expenseRequest);

            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Expense saved successfully");
            resp.put("amount", amount);
            resp.put("category", category);
            resp.put("description", description);
            resp.put("date", date);
            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            System.err.println("[ReceiptController] Save exception: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to save: " + e.getMessage()));
        }
    }
}