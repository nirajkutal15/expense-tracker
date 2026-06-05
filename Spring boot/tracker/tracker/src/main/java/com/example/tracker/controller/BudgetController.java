package com.example.tracker.controller;

import com.example.tracker.dto.BudgetRequest;
import com.example.tracker.repository.UserRepository;
import com.example.tracker.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;
    private final UserRepository userRepository;

    private Long getUserId(Authentication auth) {
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found")).getId();
    }

    @PostMapping
    public ResponseEntity<?> setBudget(@RequestBody BudgetRequest request,
                                       Authentication auth) {
        return ResponseEntity.ok(budgetService.setBudget(getUserId(auth), request));
    }

    @GetMapping
    public ResponseEntity<?> getBudgetStatus(@RequestParam int month,
                                             @RequestParam int year,
                                             Authentication auth) {
        return ResponseEntity.ok(budgetService.getBudgetStatus(getUserId(auth), month, year));
    }
}