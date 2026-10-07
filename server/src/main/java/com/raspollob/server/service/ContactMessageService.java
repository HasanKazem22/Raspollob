package com.raspollob.server.service;

import com.raspollob.server.dto.ContactMessageRequest;
import com.raspollob.server.dto.ContactMessageResponse;
import com.raspollob.server.entity.ContactMessage;
import com.raspollob.server.repository.ContactMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContactMessageService {
    private final ContactMessageRepository repository;

    @Transactional
    public void submitMessage(ContactMessageRequest request) {
        ContactMessage message = ContactMessage.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .question(request.getQuestion())
                .isRead(false)
                .build();
        repository.save(message);
    }

    @Transactional(readOnly = true)
    public List<ContactMessageResponse> getAllMessages() {
        // Newest first; id breaks ties between messages sent in the same instant
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"))).stream()
                .map(m -> ContactMessageResponse.builder()
                        .id(m.getId())
                        .name(m.getName())
                        .phone(m.getPhone())
                        .question(m.getQuestion())
                        .isRead(m.getIsRead())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long id) {
        ContactMessage message = repository.findById(id).orElseThrow(() -> new RuntimeException("Message not found"));
        message.setIsRead(true);
        repository.save(message);
    }
}
