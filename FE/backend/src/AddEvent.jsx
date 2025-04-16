import { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  VStack,
  useToast,
} from '@chakra-ui/react';

function AddEvent() {
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    capacity: '',
  });

  const toast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to save the event
    toast({
      title: 'Event Created',
      description: 'The event has been successfully created',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    setEventData({
      title: '',
      date: '',
      location: '',
      description: '',
      capacity: '',
    });
  };

  return (
    <Box maxW="800px" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Event Title</FormLabel>
            <Input
              value={eventData.title}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              placeholder="Enter event title"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Date</FormLabel>
            <Input
              type="datetime-local"
              value={eventData.date}
              onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Location</FormLabel>
            <Input
              value={eventData.location}
              onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
              placeholder="Enter event location"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Capacity</FormLabel>
            <Input
              type="number"
              value={eventData.capacity}
              onChange={(e) => setEventData({ ...eventData, capacity: e.target.value })}
              placeholder="Enter maximum capacity"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={eventData.description}
              onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
              placeholder="Enter event description"
              rows={4}
            />
          </FormControl>

          <Button type="submit" colorScheme="blue" size="lg" w="100%">
            Create Event
          </Button>
        </VStack>
      </form>
    </Box>
  );
}

export default AddEvent