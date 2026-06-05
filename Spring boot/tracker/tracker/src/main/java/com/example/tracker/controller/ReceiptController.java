package com.example.tracker.controller;

import com.example.tracker.dto.ExpenseRequest;
import com.example.tracker.repository.UserRepository;
import com.example.tracker.service.ExpenseService;
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
            return ResponseEntity.badRequest().body("No image provided");
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

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

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            Map<?, ?> responseBody = response.getBody();
            List<?> candidates = (List<?>) responseBody.get("candidates");
            Map<?, ?> firstCandidate = (Map<?, ?>) candidates.get(0);
            Map<?, ?> contentMap = (Map<?, ?>) firstCandidate.get("content");
            List<?> parts = (List<?>) contentMap.get("parts");
            Map<?, ?> firstPart = (Map<?, ?>) parts.get(0);
            String rawText = (String) firstPart.get("text");

            String cleanJson = rawText.replace("```json", "").replace("```", "").trim();

            Map<String, String> result = new HashMap<>();
            result.put("result", cleanJson);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Scan failed: " + e.getMessage());
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

            double amount = extractDouble(jsonStr, "amount");
            String category = extractString(jsonStr, "category");
            String description = extractString(jsonStr, "description");
            String date = extractString(jsonStr, "date");

            ExpenseRequest expenseRequest = new ExpenseRequest();
            expenseRequest.setAmount(amount);
            expenseRequest.setCategory(category.isEmpty() ? "Other" : category);
            expenseRequest.setDescription(description.isEmpty() ? "Receipt scan" : description);
            expenseRequest.setDate(date.isEmpty() ? LocalDate.now() : LocalDate.parse(date));

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
            return ResponseEntity.status(500).body("Failed to save: " + e.getMessage());
        }
    }

    private String extractString(String json, String key) {
        try {
            int idx = json.indexOf("\"" + key + "\"");
            if (idx == -1) return "";
            int colon = json.indexOf(":", idx);
            int start = json.indexOf("\"", colon + 1);
            int end = json.indexOf("\"", start + 1);
            return json.substring(start + 1, end);
        } catch (Exception e) {
            return "";
        }
    }

    private double extractDouble(String json, String key) {
        try {
            int idx = json.indexOf("\"" + key + "\"");
            if (idx == -1) return 0.0;
            int colon = json.indexOf(":", idx);
            int start = colon + 1;
            while (start < json.length() && json.charAt(start) == ' ') start++;
            int end = start;
            while (end < json.length() &&
                    (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.')) {
                end++;
            }
            return Double.parseDouble(json.substring(start, end));
        } catch (Exception e) {
            return 0.0;
        }
    }
}