package com.worldturism.spring.app.presentation.dto;

import com.worldturism.spring.app.domain.model.SupportStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateSupportStatusRequest(@NotNull SupportStatus status) {
}
