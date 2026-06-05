package com.example.tracker.service;

import com.example.tracker.dto.BudgetRequest;
import com.example.tracker.entity.Budget;
import com.example.tracker.entity.User;
import com.example.tracker.repository.BudgetRepository;
import com.example.tracker.repository.ExpenseRepository;
import com.example.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public Budget setBudget(Long userId, BudgetRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Budget budget = budgetRepository
                .findByUserIdAndCategoryAndMonthAndYear(
                        userId, request.getCategory(),
                        request.getMonth(), request.getYear())
                .orElse(Budget.builder().user(user).build());

        budget.setCategory(request.getCategory());
        budget.setMonthlyLimit(request.getMonthlyLimit());
        budget.setMonth(request.getMonth());
        budget.setYear(request.getYear());

        return budgetRepository.save(budget);
    }

    public List<Map<String, Object>> getBudgetStatus(Long userId, int month, int year) {
        List<Budget> budgets = budgetRepository
                .findByUserIdAndMonthAndYear(userId, month, year);

        // Fetch category totals once to avoid N+1 query problem
        List<Object[]> categoryTotals = expenseRepository
                .findCategoryTotalsByMonth(userId, month, year);

        Map<String, Double> spentByCategory = new HashMap<>();
        for (Object[] row : categoryTotals) {
            if (row[0] != null && row[1] != null) {
                spentByCategory.put(row[0].toString().toLowerCase(), ((Number) row[1]).doubleValue());
            }
        }

        return budgets.stream().map(budget -> {
            String categoryKey = budget.getCategory().toLowerCase();
            double spentAmount = spentByCategory.getOrDefault(categoryKey, 0.0);

            double limit = budget.getMonthlyLimit();
            double percentage = limit > 0.0 ? (spentAmount / limit) * 100.0 : 0.0;

            Map<String, Object> status = new HashMap<>();
            status.put("category", budget.getCategory());
            status.put("limit", limit);
            status.put("spent", spentAmount);
            status.put("remaining", limit - spentAmount);
            status.put("percentage", Math.min(percentage, 100.0));
            status.put("exceeded", spentAmount > limit);
            return status;
        }).toList();
    }
}