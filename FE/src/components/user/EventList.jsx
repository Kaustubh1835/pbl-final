import { useState, useEffect } from 'react';
import {
  SimpleGrid,
  Box,
  Image,
  Text,
  Button,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { FaCalendar, FaMapMarkerAlt, FaUsers, FaStar } from 'react-icons/fa';
import axios from 'axios';
import { useUserContext } from '../../context/UserContext';

function EventList() {
  const { isOpen, onOpen, onClose } = useDisclosure();  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState(new Set());
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const toast = useToast();
  const { user, isSignedIn, token } = useUserContext(); // Added token

  const getRandomImage = (id) => `https://picsum.photos/800/400?random=${id}`;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:3000/event/get');
        const eventsWithImages = response.data.events.map(event => ({
          ...event,
          image: getRandomImage(event.id),
          participants: event.participants || [],
        }));
        setEvents(eventsWithImages);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.response?.data?.msg || 'Failed to fetch events',
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

  useEffect(() => {
    if (user) {
      const key = `registeredEvents_${user.id}`;
      setRegisteredEvents(new Set(JSON.parse(localStorage.getItem(key) || '[]')));
    }
  }, [user]);

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    onOpen();
  };
  const handleRegister = async () => {
    if (!isSignedIn) {
      toast({
        title: 'Error',
        description: 'Please log in to register',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!token) {
      toast({
        title: 'Error',
        description: 'No authentication token available',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:3000/event/register/${selectedEvent.id}`,
        { userId: user.id },
        { headers: { Authorization: `Bearer ${token}` } } // Added token to header
      );
      toast({
        title: 'Registration Successful',
        description: response.data.msg,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      const newParticipant = response.data.participant;

      const updatedEvents = events.map(event =>
        event.id === selectedEvent.id
          ? { ...event, participants: [...event.participants, newParticipant] }
          : event
      );
      setEvents(updatedEvents);      setSelectedEvent({
        ...selectedEvent,
        participants: [...selectedEvent.participants, newParticipant],
      });

      // Update registered events in state and localStorage
      const updatedRegisteredEvents = new Set([...registeredEvents]).add(selectedEvent.id);
      setRegisteredEvents(updatedRegisteredEvents);
      
      // Save to localStorage
      if (user && user.id) {
        const key = `registeredEvents_${user.id}`;
        localStorage.setItem(key, JSON.stringify([...updatedRegisteredEvents]));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to register',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Registration error:', error.response?.data || error.message);
    }
  };

  const submitFeedback = async (eventId, rating) => {
    if (!isSignedIn || !user || !token) {
      toast({
        title: 'Error',
        description: 'Please log in to submit feedback',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await axios.post(
        `http://localhost:3000/event/${eventId}/feedback`,
        { 
          userId: user.id,
          rating: rating 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Update the local event data with the new feedback
      const updatedEvents = events.map(event => 
        event.id === eventId 
          ? { ...event, userFeedback: rating } 
          : event
      );
      setEvents(updatedEvents);
      
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent({
          ...selectedEvent,
          userFeedback: rating
        });
      }
      
      // Reset rating state
      setRating(0);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to submit feedback',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Feedback error:', error.response?.data || error.message);
    }
  };

  if (!isSignedIn) {
    return <Text>Please log in to view and register for events</Text>;
  }

  if (loading) {
    return <Text>Loading events...</Text>;
  }

  return (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" mb={6}>Upcoming Events</Text>
      {events.length === 0 ? (
        <Text>No events found</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {events.map((event) => (
            <Box key={event.id} bg="white" rounded="lg" shadow="md" overflow="hidden">
              <Image src={event.image} alt={event.title} h="200px" w="100%" objectFit="cover" />
              <Box p={5}>
                <Text fontSize="xl" fontWeight="semibold" mb={2}>{event.title}</Text>
                <VStack align="stretch" spacing={2} mb={4}>
                  <HStack><FaCalendar /><Text>{new Date(event.date).toLocaleDateString()}</Text></HStack>
                  <HStack><FaMapMarkerAlt /><Text>{event.location}</Text></HStack>
                  <HStack><FaUsers /><Text>{event.participants.length}/{event.capacity} registered</Text></HStack>                </VStack>                
                <Button 
                  colorScheme={registeredEvents.has(event.id) ? "green" : "blue"} 
                  width="100%" 
                  onClick={() => handleViewDetails(event)}
                  mb={registeredEvents.has(event.id) ? 2 : 0}
                >
                  {registeredEvents.has(event.id) ? "Registered" : "View Details"}
                </Button>
                
                {/* Show star rating on card if user is registered for this event */}
                {registeredEvents.has(event.id) && (
                  <Box mt={2}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>Rate this event:</Text>
                    <HStack spacing={1} justify="center">
                      {[...Array(5)].map((_, i) => {
                        const ratingValue = i + 1;
                        return (
                          <Box
                            key={i}
                            as="button"
                            aria-label={`Rate ${ratingValue} stars`}
                            onClick={() => submitFeedback(event.id, ratingValue)}
                            onMouseEnter={() => setHover(ratingValue)}
                            onMouseLeave={() => setHover(0)}
                          >
                            <FaStar
                              size={20}
                              color={ratingValue <= (event.userFeedback || 0) ? "#FFD700" : "#e4e5e9"}
                            />
                          </Box>
                        );
                      })}
                    </HStack>
                    {event.userFeedback && (
                      <Text fontSize="xs" textAlign="center" mt={1}>
                        Your rating: {event.userFeedback}/5
                      </Text>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedEvent?.title || 'Event Details'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedEvent ? (
              <VStack align="stretch" spacing={4}>
                <Image src={selectedEvent.image} alt={selectedEvent.title} rounded="lg" mb={4} />
                <Text>{selectedEvent.description}</Text>
                <HStack><FaCalendar /><Text>Date: {new Date(selectedEvent.date).toLocaleDateString()}</Text></HStack>
                <HStack><FaMapMarkerAlt /><Text>Location: {selectedEvent.location}</Text></HStack>
                <HStack><FaUsers /><Text>Registered: {selectedEvent.participants.length}/{selectedEvent.capacity}</Text></HStack>                {selectedEvent.participants.length >= selectedEvent.capacity ? (
                  <Badge colorScheme="red" p={2} textAlign="center">Event Full</Badge>
                ) : user && user.id && selectedEvent.participants.some(p => p._id?.toString() === user.id.toString()) ? (
                  <>
                    <Button colorScheme="green" isDisabled mb={3}>Registered</Button>
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Rate this event:</Text>
                      <HStack spacing={1}>
                        {[...Array(5)].map((_, i) => {
                          const ratingValue = i + 1;
                          return (
                            <Box
                              key={i}
                              as="button"
                              aria-label={`Rate ${ratingValue} stars`}
                              onClick={() => submitFeedback(selectedEvent.id, ratingValue)}
                              onMouseEnter={() => setHover(ratingValue)}
                              onMouseLeave={() => setHover(0)}
                            >
                              <FaStar
                                size={24}
                                color={ratingValue <= (hover || rating || selectedEvent.userFeedback || 0) ? "#FFD700" : "#e4e5e9"}
                              />
                            </Box>
                          );
                        })}
                      </HStack>
                      {selectedEvent.userFeedback && (
                        <Text fontSize="sm" mt={1}>
                          Your rating: {selectedEvent.userFeedback}/5
                        </Text>
                      )}
                    </Box>
                  </>
                ) : (
                  <Button colorScheme="blue" onClick={handleRegister}>Register Now</Button>
                )}
              </VStack>
            ) : (
              <Text>No event selected</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default EventList;