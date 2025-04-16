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
import axios from 'axios';

function AddEvent() {
  const [eventData, setEventData] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    capacity: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convert capacity to number before sending
      const payload = {
        ...eventData,
        capacity: parseInt(eventData.capacity)
      };

      const response = await axios.post('http://localhost:3000/event/add', payload);
      
      toast({
        title: 'Event Created',
        description: response.data.msg,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form after successful submission
      setEventData({
        title: '',
        date: '',
        location: '',
        description: '',
        capacity: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to create event',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      
      // If there are specific validation errors, you can show them
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast({
            title: 'Validation Error',
            description: err.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
      }
    } finally {
      setIsLoading(false);
    }
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
              min="1"
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

          <Button 
            type="submit" 
            colorScheme="blue" 
            size="lg" 
            w="100%"
            isLoading={isLoading}
            loadingText="Creating..."
          >
            Create Event
          </Button>
        </VStack>
      </form>
    </Box>
  );
}

export default AddEvent;