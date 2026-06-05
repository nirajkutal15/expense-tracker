package com.example.tracker.controller;

import com.example.tracker.dto.ExpenseRequest;
import com.example.tracker.repository.UserRepository;
import com.example.tracker.service.ExpenseService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserRepository userRepository;

    private Long getUserId(Authentication auth) {
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found")).getId();
    }

    @PostMapping
    public ResponseEntity<?> addExpense(@RequestBody ExpenseRequest request,
                                        Authentication auth) {
        return ResponseEntity.ok(expenseService.addExpense(getUserId(auth), request));
    }

    @GetMapping
    public ResponseEntity<?> getAllExpenses(Authentication auth) {
        return ResponseEntity.ok(expenseService.getAllExpenses(getUserId(auth)));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<?> getByCategory(@PathVariable String category,
                                           Authentication auth) {
        return ResponseEntity.ok(expenseService.getExpensesByCategory(getUserId(auth), category));
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(@RequestParam int month,
                                        @RequestParam int year,
                                        Authentication auth) {
        return ResponseEntity.ok(expenseService.getSummary(getUserId(auth), month, year));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable Long id,
                                           @RequestBody ExpenseRequest request,
                                           Authentication auth) {
        return ResponseEntity.ok(expenseService.updateExpense(id, getUserId(auth), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id,
                                           Authentication auth) {
        expenseService.deleteExpense(id, getUserId(auth));
        return ResponseEntity.ok(Map.of("message", "Expense deleted"));
    }

    @GetMapping("/export/csv")
    public void exportCsv(HttpServletResponse response,
                          Authentication auth) throws IOException {
        Long userId = getUserId(auth);
        var expenses = expenseService.getAllExpenses(userId);

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=expenses.csv");

        java.io.PrintWriter writer = response.getWriter();
        writer.println("ID,Amount,Category,Description,Date");

        for (var e : expenses) {
            writer.println(
                    e.getId() + "," +
                            e.getAmount() + "," +
                            e.getCategory() + "," +
                            (e.getDescription() != null ? e.getDescription().replace(",", ";") : "") + "," +
                            e.getDate()
            );
        }
        writer.flush();
    }
}