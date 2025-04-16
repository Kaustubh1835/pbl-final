import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Text,
  VStack,
  Textarea,
} from '@chakra-ui/react';
import { useState } from 'react';

function OngoingEvents() {
  const toast = useToast();
  const { isOpen: isFeedbackOpen, onOpen: onFeedbackOpen, onClose: onFeedbackClose } = useDisclosure();
  const { isOpen: isNotificationOpen, onOpen: onNotificationOpen, onClose: onNotificationClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Mock data - replace with actual API data
  const events = [
    {
      id: 1,
      title: 'Tech Conference 2024',
      participants: 250,
      registrations: 300,
      feedback: 4.5,
      status: 'active',
    },
    {
      id: 2,
      title: 'Digital Summit',
      participants: 180,
      registrations: 200,
      feedback: 4.2,
      status: 'active',
    },
  ];

  const handlePushNotification = (event) => {
    setSelectedEvent(event);
    onNotificationOpen();
  };

  const sendNotification = () => {
    // Here you would typically make an API call to send the notification
    toast({
      title: 'Notification Sent',
      description: 'Push notification has been sent to all participants',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    setNotificationMessage('');
    onNotificationClose();
  };

  const handleViewFeedback = (event) => {
    setSelectedEvent(event);
    onFeedbackOpen();
  };

  return (
    <Box>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Event Title</Th>
            <Th>Participants</Th>
            <Th>Registrations</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {events.map((event) => (
            <Tr key={event.id}>
              <Td>{event.title}</Td>
              <Td>{event.participants}</Td>
              <Td>{event.registrations}</Td>
              <Td>
                <Badge colorScheme="green">{event.status}</Badge>
              </Td>
              <Td>
                <Button
                  size="sm"
                  colorScheme="blue"
                  mr={2}
                  onClick={() => handlePushNotification(event)}
                >
                  Push Notification
                </Button>
                <Button
                  size="sm"
                  colorScheme="teal"
                  onClick={() => handleViewFeedback(event)}
                >
                  View Feedback
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Feedback Modal */}
      <Modal isOpen={isFeedbackOpen} onClose={onFeedbackClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Event Feedback</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedEvent && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold">Event: {selectedEvent.title}</Text>
                  <Text>Average Rating: {selectedEvent.feedback}/5</Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Push Notification Modal */}
      <Modal isOpen={isNotificationOpen} onClose={onNotificationClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Push Notification</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedEvent && (
              <VStack align="stretch" spacing={4}>
                <Text fontWeight="bold">Event: {selectedEvent.title}</Text>
                <Text mb={2}>Enter your message:</Text>
                <Textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Type your notification message here..."
                  rows={4}
                />
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={sendNotification}>
              Send Notification
            </Button>
            <Button onClick={onNotificationClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default OngoingEvents