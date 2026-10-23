package com.forsneakypea.fspbackend.controller;

import com.fasterxml.jackson.databind.SerializationFeature;
import com.forsneakypea.fspbackend.dto.HomeSummaryDTO;
import com.forsneakypea.fspbackend.entity.DateStatus;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.service.HomeService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HomeControllerTest {

    private HomeService homeService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        homeService = mock(HomeService.class);
        // Same JSON settings Spring Boot applies in the real app (ISO dates, not arrays).
        MappingJackson2HttpMessageConverter json = new MappingJackson2HttpMessageConverter(
                Jackson2ObjectMapperBuilder.json().featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS).build());
        mvc = MockMvcBuilders.standaloneSetup(new HomeController(homeService)).setMessageConverters(json).build();
        User me = User.builder().id(1L).username("merylle").name("Merylle").build();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(me, null, me.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void summaryHasExactlyTheFieldsTheHomePageRenders() throws Exception {
        UUID folderId = UUID.randomUUID();
        when(homeService.getSummary(eq(1L), eq(LocalDate.of(2026, 10, 23)))).thenReturn(HomeSummaryDTO.builder()
                .folders(List.of(HomeSummaryDTO.FolderCard.builder().id(folderId).name("Beach").description("Sun")
                        .coverImageUrl("https://img/a.jpg").photoCount(4).build()))
                .upcomingDates(List.of(HomeSummaryDTO.DateCard.builder().id(UUID.randomUUID()).title("Picnic")
                        .plannedDate(LocalDate.of(2026, 11, 2)).location("Park").status(DateStatus.PLANNING).build()))
                .latestNote(HomeSummaryDTO.NoteCard.builder().content("hello").authorName("CJ")
                        .createdAt(OffsetDateTime.parse("2026-10-20T08:00:00Z")).build())
                .build());

        mvc.perform(get("/api/v1/home/summary").param("today", "2026-10-23"))
                .andExpect(status().isOk())
                // top level: only the three sections
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$.folders[0].id").value(folderId.toString()))
                .andExpect(jsonPath("$.folders[0].name").value("Beach"))
                .andExpect(jsonPath("$.folders[0].photoCount").value(4))
                .andExpect(jsonPath("$.folders[0].length()").value(5))      // id, name, description, coverImageUrl, photoCount
                .andExpect(jsonPath("$.upcomingDates[0].title").value("Picnic"))
                .andExpect(jsonPath("$.upcomingDates[0].plannedDate").value("2026-11-02"))
                .andExpect(jsonPath("$.upcomingDates[0].status").value("PLANNING"))
                .andExpect(jsonPath("$.upcomingDates[0].length()").value(5)) // id, title, plannedDate, location, status
                .andExpect(jsonPath("$.latestNote.content").value("hello"))
                .andExpect(jsonPath("$.latestNote.authorName").value("CJ"))
                .andExpect(jsonPath("$.latestNote.length()").value(3));      // content, createdAt, authorName
    }

    @Test
    void todayIsOptional() throws Exception {
        when(homeService.getSummary(eq(1L), org.mockito.ArgumentMatchers.isNull())).thenReturn(HomeSummaryDTO.builder()
                .folders(List.of()).upcomingDates(List.of()).latestNote(null).build());

        mvc.perform(get("/api/v1/home/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.folders.length()").value(0))
                .andExpect(jsonPath("$.latestNote").doesNotExist());

        verify(homeService).getSummary(eq(1L), org.mockito.ArgumentMatchers.isNull());
    }

    @Test
    void anInvalidTodayIsA400NotA500() throws Exception {
        mvc.perform(get("/api/v1/home/summary").param("today", "not-a-date")).andExpect(status().isBadRequest());
    }
}
