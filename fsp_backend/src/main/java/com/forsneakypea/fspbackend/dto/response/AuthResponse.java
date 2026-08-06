package com.forsneakypea.fspbackend.dto.response;

import com.forsneakypea.fspbackend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String token;
    private String username;
    private String name;
    private Role role;

    // Profile customization — without these, the frontend's cached login
    // payload (the only source it restores `user` from on refresh/re-login)
    // has no avatar/nickname/etc., so they appear to "vanish" until the next
    // profile save re-patches them into the cached user object client-side.
    private String nickname;
    private String bio;
    private String favoriteEmoji;
    private String accentColor;
    private String avatarUrl;
}