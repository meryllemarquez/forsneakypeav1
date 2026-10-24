package com.forsneakypea.fspbackend.service;

import com.forsneakypea.fspbackend.dto.DateEntryDTO;
import com.forsneakypea.fspbackend.dto.DateRequestDTO;
import com.forsneakypea.fspbackend.entity.DateEntry;
import com.forsneakypea.fspbackend.entity.DateStatus;
import com.forsneakypea.fspbackend.entity.FavorableType;
import com.forsneakypea.fspbackend.entity.Favorite;
import com.forsneakypea.fspbackend.entity.Role;
import com.forsneakypea.fspbackend.entity.User;
import com.forsneakypea.fspbackend.repository.ChecklistItemRepository;
import com.forsneakypea.fspbackend.repository.DateCategoryRepository;
import com.forsneakypea.fspbackend.repository.DateEntryRepository;
import com.forsneakypea.fspbackend.repository.FavoriteRepository;
import com.forsneakypea.fspbackend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class DateServiceTest {

    private DateEntryRepository dateEntryRepository;
    private FavoriteRepository favoriteRepository;
    private ChecklistItemRepository checklistItemRepository;
    private UserRepository userRepository;
    private DateService service;

    private final User me = User.builder().id(1L).username("merylle").name("Merylle").role(Role.ROLE_USER).build();

    @BeforeEach
    void setUp() {
        dateEntryRepository = mock(DateEntryRepository.class);
        favoriteRepository = mock(FavoriteRepository.class);
        checklistItemRepository = mock(ChecklistItemRepository.class);
        userRepository = mock(UserRepository.class);
        service = new DateService(dateEntryRepository, mock(DateCategoryRepository.class), mock(ActivityLogService.class),
                mock(NotificationService.class), favoriteRepository, checklistItemRepository, userRepository,
                mock(ChecklistItemService.class), new MediaUrlService(), mock(UploadService.class), mock(DriveClient.class));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(me, null, me.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private DateEntry date(Long createdBy) {
        return DateEntry.builder().id(UUID.randomUUID()).title("Picnic").status(DateStatus.DREAMING)
                .createdBy(createdBy).isArchived(false).build();
    }

    @Test
    void favoritingDoesNotReloadFavoritesOrTheCreator() {
        DateEntry picnic = date(1L); // created by the current user
        when(dateEntryRepository.findByIdAndDeletedAtIsNull(picnic.getId())).thenReturn(Optional.of(picnic));
        when(favoriteRepository.findByUserIdAndFavorableTypeAndFavorableIdAndDeletedAtIsNull(
                1L, FavorableType.DATE, picnic.getId())).thenReturn(Optional.empty());

        DateEntryDTO dto = service.setFavorite(picnic.getId(), true, 1L);

        assertTrue(dto.getIsFavorite());
        assertEquals("Merylle", dto.getCreatedByName());
        verify(favoriteRepository).save(any(Favorite.class));
        // The final favorite state is known, so the DTO needs neither of these queries:
        verify(favoriteRepository, never()).findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(anyLong());
        verify(favoriteRepository, never()).existsByUserIdAndFavorableTypeAndFavorableIdAndDeletedAtIsNull(any(), any(), any());
        verify(userRepository, never()).findById(any());
    }

    @Test
    void unfavoritingReportsNotFavorite() {
        DateEntry picnic = date(1L);
        Favorite existing = Favorite.builder().userId(1L).favorableType(FavorableType.DATE).favorableId(picnic.getId()).build();
        when(dateEntryRepository.findByIdAndDeletedAtIsNull(picnic.getId())).thenReturn(Optional.of(picnic));
        when(favoriteRepository.findByUserIdAndFavorableTypeAndFavorableIdAndDeletedAtIsNull(
                1L, FavorableType.DATE, picnic.getId())).thenReturn(Optional.of(existing));

        DateEntryDTO dto = service.setFavorite(picnic.getId(), false, 1L);

        assertFalse(dto.getIsFavorite());
        verify(favoriteRepository).save(existing);
    }

    @Test
    void creatorNameIsLookedUpOnlyWhenSomeoneElseCreatedTheDate() {
        DateEntry partnersDate = date(2L);
        when(dateEntryRepository.findByIdAndDeletedAtIsNull(partnersDate.getId())).thenReturn(Optional.of(partnersDate));
        when(favoriteRepository.findByUserIdAndFavorableTypeAndFavorableIdAndDeletedAtIsNull(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(userRepository.findById(2L)).thenReturn(Optional.of(User.builder().id(2L).name("CJ").build()));

        DateEntryDTO dto = service.setFavorite(partnersDate.getId(), true, 1L);

        assertEquals("CJ", dto.getCreatedByName());
        verify(userRepository, times(1)).findById(2L);
    }

    @Test
    void singleDateMappingChecksOneFavoriteRowInsteadOfLoadingAllFavorites() {
        DateEntry picnic = date(1L);
        when(dateEntryRepository.findByIdAndDeletedAtIsNull(picnic.getId())).thenReturn(Optional.of(picnic));
        when(dateEntryRepository.save(any(DateEntry.class))).thenAnswer(inv -> inv.getArgument(0));
        when(favoriteRepository.existsByUserIdAndFavorableTypeAndFavorableIdAndDeletedAtIsNull(
                1L, FavorableType.DATE, picnic.getId())).thenReturn(true);

        DateEntryDTO dto = service.archiveDate(picnic.getId(), 1L);

        assertTrue(dto.getIsFavorite());
        verify(favoriteRepository, never()).findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(anyLong());
    }

    @Test
    void createDateSkipsTheFavoriteAndChecklistQueriesForABrandNewDate() {
        when(dateEntryRepository.save(any(DateEntry.class))).thenAnswer(inv -> {
            DateEntry saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        DateRequestDTO.Create request = new DateRequestDTO.Create();
        request.setTitle("Sunset walk");

        DateEntryDTO dto = service.createDate(request, 1L);

        assertEquals("Sunset walk", dto.getTitle());
        assertFalse(dto.getIsFavorite());
        assertEquals(0, dto.getChecklistTotalCount());
        verifyNoInteractions(favoriteRepository);
        verifyNoInteractions(checklistItemRepository);
        verifyNoInteractions(userRepository);
    }
}
