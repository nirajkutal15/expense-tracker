package com.example.tracker.service;

import com.example.tracker.dto.ExpenseRequest;
import com.example.tracker.entity.Expense;
import com.example.tracker.entity.User;
import com.example.tracker.repository.ExpenseRepository;
import com.example.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public Expense addExpense(Long userId, ExpenseRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Expense expense = Expense.builder()
                .amount(request.getAmount())
                .category(request.getCategory())
                .description(request.getDescription())
                .date(request.getDate())
                .user(user)
                .build();

        return expenseRepository.save(expense);
    }

    public List<Expense> getAllExpenses(Long userId) {
        return expenseRepository.findByUserId(userId);
    }

    public List<Expense> getExpensesByCategory(Long userId, String category) {
        return expenseRepository.findByUserIdAndCategory(userId, category);
    }

    public Expense updateExpense(Long expenseId, Long userId, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getUser().getId().equals(userId))
            throw new RuntimeException("Unauthorized");

        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setDescription(request.getDescription());
        expense.setDate(request.getDate());

        return expenseRepository.save(expense);
    }

    public void deleteExpense(Long expenseId, Long userId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getUser().getId().equals(userId))
            throw new RuntimeException("Unauthorized");

        expenseRepository.delete(expense);
    }

    public Map<String, Object> getSummary(Long userId, int month, int year) {
        Double total = expenseRepository.findMonthlyTotal(userId, month, year);
        List<Object[]> categoryTotals = expenseRepository.findCategoryTotalsByMonth(userId, month, year);
        List<Object[]> dailyTotals = expenseRepository.findDailyTotals(userId, month, year);

        Map<String, Double> categoryMap = new HashMap<>();
        for (Object[] row : categoryTotals) {
            categoryMap.put((String) row[0], ((Number) row[1]).doubleValue());
        }

        Map<Integer, Double> dailyMap = new HashMap<>();
        for (Object[] row : dailyTotals) {
            dailyMap.put(((Number) row[0]).intValue(), ((Number) row[1]).doubleValue());
        }

        return Map.of(
                "totalSpent", total != null ? total : 0.0,
                "categoryBreakdown", categoryMap,
                "dailyBreakdown", dailyMap,
                "month", month,
                "year", year
        );
    }
}