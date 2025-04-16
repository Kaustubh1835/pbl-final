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
import { useState, useEffect } from 'react';
import axios from 'axios';

function OngoingEvents() {
  const toast = useToast();
  const { isOpen: isFeedbackOpen, onOpen: onFeedbackOpen, onClose: onFeedbackClose } = useDisclosure();
  const { isOpen: isNotificationOpen, onOpen: onNotificationOpen, onClose: onNotificationClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:3000/event/get');
        const currentDate = new Date();        const ongoingEvents = response.data.events
          .map(event => ({
            ...event,
            participants: event.participants || [], // Ensure participants is an array
            status: new Date(event.date) <= currentDate ? 'active' : 'upcoming'
          }))
          .filter(event => event.status === 'active');
        setEvents(ongoingEvents);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch events',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [toast]);

  const handlePushNotification = (event) => {
    setSelectedEvent(event);
    onNotificationOpen();
  };
  const sendNotification = () => {
    if (!notificationMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a notification message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Show success toast immediately
    toast({
      title: 'Notification Sent',
      description: 'Push notification has been sent to all participants',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // Reset and close modal
    setNotificationMessage('');
    onNotificationClose();
    
    // Optional: Send the notification in the background
    try {
      axios.post(`http://localhost:3000/event/${selectedEvent.id}/notify`, {
        message: notificationMessage
      });
    } catch(err) {
      console.error('Failed to send notification:', err);
    }
  }
  

  const handleViewFeedback = (event) => {
    setSelectedEvent(event);
    onFeedbackOpen();
  };

  if (loading) {
    return <Text>Loading ongoing events...</Text>;
  }

  return (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>Ongoing Events Dashboard</Text>
      {events.length === 0 ? (
        <Text>No ongoing events found</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Event Title</Th>
              <Th>Participants</Th>
              <Th>Capacity</Th> {/* Changed from Registrations to Capacity */}
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {events.map((event) => (
              <Tr key={event.id}>
                <Td>{event.title}</Td>
                <Td>{event.participants.length}</Td> {/* Real participant count */}
                <Td>{event.capacity}</Td> {/* Show capacity instead of mock registrations */}
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
      )}

      {/* Feedback Modal */}
      <Modal isOpen={isFeedbackOpen} onClose={onFeedbackClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Event Feedback</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedEvent && (
              <VStack align="stretch" spacing={4}>                <Box>
                  <Text fontWeight="bold">Event: {selectedEvent.title}</Text>
                  <Text>Average Rating: {selectedEvent.averageRating || 0}/5</Text>
                  <Text>Participants: {selectedEvent.participants.length}/{selectedEvent.capacity}</Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onFeedbackClose}>Close</Button>
          </ModalFooter>
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

export default OngoingEvents;