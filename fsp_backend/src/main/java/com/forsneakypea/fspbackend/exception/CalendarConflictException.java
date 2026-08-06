package com.forsneakypea.fspbackend.exception;

import com.forsneakypea.fspbackend.dto.CalendarConflictDTO;
import lombok.Getter;

@Getter
public class CalendarConflictException extends RuntimeException {
    private final CalendarConflictDTO conflict;

    public CalendarConflictException(String message, CalendarConflictDTO conflict) {
        super(message);
        this.conflict = conflict;
    }
}
