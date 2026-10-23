package com.forsneakypea.fspbackend.controller;

import com.forsneakypea.fspbackend.dto.LoveNoteRequestDTO;
import com.forsneakypea.fspbackend.repository.ActivityLogRepository;
import com.forsneakypea.fspbackend.service.ActivityLogService;
import com.forsneakypea.fspbackend.service.LoveBoardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Plain MockMvc (no security) around the controllers whose HTTP contract changed. */
class ControllerBehaviourTest {

    private LoveBoardService loveBoardService;
    private ActivityLogService activityLogService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        loveBoardService = mock(LoveBoardService.class);
        activityLogService = mock(ActivityLogService.class);
        mvc = MockMvcBuilders.standaloneSetup(
                new LoveBoardController(loveBoardService),
                new ActivityLogController(activityLogService, mock(ActivityLogRepository.class))).build();
    }

    @Test
    void notePositionPatchAnswers204WithNoBody() throws Exception {
        UUID id = UUID.randomUUID();

        mvc.perform(patch("/api/v1/love-board/notes/{id}/position", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"positionX\": 12.5, \"positionY\": 40, \"rotation\": 3, \"zIndex\": 7}"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        ArgumentCaptor<LoveNoteRequestDTO.PositionUpdate> body = ArgumentCaptor.forClass(LoveNoteRequestDTO.PositionUpdate.class);
        verify(loveBoardService).updateNotePosition(any(UUID.class), body.capture());
        assertEquals(12.5, body.getValue().getPositionX());
        assertEquals(7, body.getValue().getZIndex());
    }

    private Pageable searchWithSize(String size) throws Exception {
        when(activityLogService.search(any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 1), 0));
        mvc.perform(get("/api/v1/activity-logs").param("size", size)).andExpect(status().isOk());
        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(activityLogService, org.mockito.Mockito.atLeastOnce())
                .search(any(), any(), any(), any(), any(), any(), pageable.capture());
        return pageable.getValue();
    }

    @Test
    void activityLogPageSizeIsCappedAtOneHundred() throws Exception {
        assertEquals(100, searchWithSize("100000").getPageSize());
    }

    @Test
    void activityLogPageSizeBelowTheCapIsKept() throws Exception {
        assertEquals(15, searchWithSize("15").getPageSize());
    }

    @Test
    void activityLogPageSizeNeverDropsBelowOne() throws Exception {
        assertEquals(1, searchWithSize("0").getPageSize());
    }
}
