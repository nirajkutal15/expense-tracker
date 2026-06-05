package com.example.tracker.dto;

import lombok.Data;

@Data
public class BudgetRequest {
    private String category;
    private Double monthlyLimit;
    private Integer month;
    private Integer year;
}