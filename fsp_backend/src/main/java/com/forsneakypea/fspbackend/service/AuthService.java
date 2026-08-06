package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.request.LoginRequest;
import com.forsneakypea.fspbackend.dto.request.RegisterRequest;
import com.forsneakypea.fspbackend.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
}