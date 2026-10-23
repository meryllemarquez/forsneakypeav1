package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.LoveNoteDTO;
import com.forsneakypea.fspbackend.dto.LoveNoteRequestDTO;
import com.forsneakypea.fspbackend.entity.LoveNote;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.LoveNoteRepository;
import com.forsneakypea.fspbackend.repository.LoveStickerRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class LoveBoardServiceTest {

    private LoveNoteRepository noteRepository;
    private UserRepository userRepository;
    private NotificationService notificationService;
    private LoveBoardService service;

    private final User me = User.builder().id(1L).username("merylle").name("Merylle").build();

    @BeforeEach
    void setUp() {
        noteRepository = mock(LoveNoteRepository.class);
        userRepository = mock(UserRepository.class);
        notificationService = mock(NotificationService.class);
        service = new LoveBoardService(noteRepository, mock(LoveStickerRepository.class), userRepository,
                mock(ActivityLogService.class), notificationService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private static LoveNote note(Long createdBy, boolean isPrivate) {
        return LoveNote.builder().id(UUID.randomUUID()).title("t").paperImage("p").createdBy(createdBy)
                .isPrivate(isPrivate).build();
    }

    @Test
    @SuppressWarnings("unchecked")
    void visibleNotesLoadOnlyTheAuthorsThatAppearInsteadOfTheWholeUsersTable() {
        LoveNote mine = note(1L, false);
        LoveNote theirs = note(2L, false);
        LoveNote theirsToo = note(2L, false);
        LoveNote hiddenPrivate = note(3L, true); // someone else's private note: not visible, author not needed
        when(noteRepository.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(mine, theirs, theirsToo, hiddenPrivate));
        when(userRepository.findAllById(anyCollection())).thenReturn(List.of(
                User.builder().id(1L).name("Merylle").build(), User.builder().id(2L).name("CJ").build()));

        List<LoveNoteDTO> notes = service.getVisibleNotes(1L);

        assertEquals(3, notes.size());
        assertEquals("Merylle", notes.get(0).getAuthorName());
        assertEquals("CJ", notes.get(1).getAuthorName());
        ArgumentCaptor<Collection<Long>> ids = ArgumentCaptor.forClass(Collection.class);
        verify(userRepository).findAllById(ids.capture());
        assertEquals(Set.of(1L, 2L), Set.copyOf(ids.getValue()));
        verify(userRepository, never()).findAll();
        verify(userRepository, never()).findById(any());
    }

    @Test
    void visibleNotesWithNoAuthorsRunsNoUserQuery() {
        when(noteRepository.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(note(null, false)));

        List<LoveNoteDTO> notes = service.getVisibleNotes(1L);

        assertEquals(1, notes.size());
        assertNull(notes.get(0).getAuthorName());
        verifyNoInteractions(userRepository);
    }

    @Test
    void positionUpdateReturnsNothingAndNeverLooksUpTheAuthor() {
        LoveNote existing = note(2L, false);
        existing.setPositionX(1.0);
        when(noteRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        LoveNoteRequestDTO.PositionUpdate request = new LoveNoteRequestDTO.PositionUpdate();
        request.setPositionX(120.5);
        request.setPositionY(80.0);

        service.updateNotePosition(existing.getId(), request);

        assertEquals(120.5, existing.getPositionX());
        assertEquals(80.0, existing.getPositionY());
        verify(noteRepository).save(existing);
        verifyNoInteractions(userRepository);
        verifyNoInteractions(notificationService);
    }

    @Test
    void editingYourOwnNoteUsesTheAuthenticatedUserForTheAuthorName() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(me, null, me.getAuthorities()));
        LoveNote existing = note(1L, false);
        when(noteRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(noteRepository.saveAndFlush(any(LoveNote.class))).thenAnswer(inv -> inv.getArgument(0));
        LoveNoteRequestDTO.NoteUpdate update = new LoveNoteRequestDTO.NoteUpdate();
        update.setTitle("new title");

        LoveNoteDTO dto = service.updateNote(existing.getId(), update, 1L);

        assertEquals("Merylle", dto.getAuthorName());
        verify(userRepository, never()).findById(any());
    }
}
