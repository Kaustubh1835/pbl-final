import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf'; // For PDF generation

function Dashboard() {
  const toast = useToast();
  const { isOpen: isSummaryOpen, onOpen: onSummaryOpen, onClose: onSummaryClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    capacity: '',
  });
  const [reportContent, setReportContent] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);
  const token = localStorage.getItem('token'); // Assuming token is stored in localStorage

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:3000/event/get');
        const currentDate = new Date();
        const allEvents = response.data.events.map(event => ({
          ...event,
          id: event.id || event._id,
          participants: event.participants || [],
          status: new Date(event.date) <= currentDate ? 'active' : 'upcoming',
        }));
        setEvents(allEvents);
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

  const handleViewSummary = (event) => {
    setSelectedEvent(event);
    setReportContent('');
    onSummaryOpen();
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setEditData({
      title: event.title,
      date: event.date.slice(0, 16),
      location: event.location,
      description: event.description,
      capacity: event.capacity.toString(),
    });
    onEditOpen();
  };

  const handleUpdateEvent = async () => {
    try {
      const payload = {
        ...editData,
        capacity: parseInt(editData.capacity),
      };
      const response = await axios.put(`http://localhost:3000/event/update/${selectedEvent.id}`, payload);
      toast({
        title: 'Event Updated',
        description: response.data.msg,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setEvents(events.map(event =>
        event.id === selectedEvent.id ? { ...event, ...payload } : event
      ));
      onEditClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to update event',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await axios.delete(`http://localhost:3000/event/delete/${eventId}`);
      toast({
        title: 'Event Deleted',
        description: response.data.msg,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to delete event',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!token) {
      toast({
        title: 'Error',
        description: 'Please log in to generate a report',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoadingReport(true);
    setReportContent('');

    try {
      const response = await axios.post(
        `http://localhost:3000/event/report/${selectedEvent.id}`,
        { duration: "Not specified" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReportContent(response.data.report);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to generate report',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setReportContent('Error generating report.');
    } finally {
      setLoadingReport(false);
    }
  };

  const downloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set font for the document
    doc.setFont('Times-Roman');

    // Title: Centered, Bold, Uppercase
    doc.setFontSize(16);
    doc.setFont('Times-Roman', 'bold');
    const title = 'Post-Event Summary Report';
    const titleWidth = doc.getTextWidth(title);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(title, (pageWidth - titleWidth) / 2, 20); // Center the title at 20mm from top

    // Reset font for body text
    doc.setFontSize(12);
    doc.setFont('Times-Roman', 'normal');

    // Split the report content into lines
    const lines = doc.splitTextToSize(reportContent, 180); // 180mm width with margins

    // Start position for body text
    let yPosition = 40; // Start 40mm from top (after title)

    // Process each line to apply styling
    lines.forEach(line => {
      // Bold headings (e.g., "Event Details:", "Event Summary:")
      if (line.includes('Event Details:') || line.includes('Event Summary:')) {
        doc.setFont('Times-Roman', 'bold');
        doc.text(line, 15, yPosition); // Left-aligned with 15mm margin
      } else {
        doc.setFont('Times-Roman', 'normal');
        // Check for lines starting with "- " (list items) and indent them
        if (line.trim().startsWith('-')) {
          doc.text(line, 20, yPosition); // Indent list items by 20mm
        } else {
          doc.text(line, 15, yPosition); // Normal text with 15mm margin
        }
      }
      yPosition += 7; // Line spacing (7mm per line)

      // Add a new page if content exceeds page height
      if (yPosition > 270) { // 270mm is near the bottom of A4 page
        doc.addPage();
        yPosition = 20; // Reset yPosition for new page
      }
    });

    // Save the PDF
    doc.save(`${selectedEvent.title}_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalEvents = events.length;
  const totalParticipants = events.reduce((sum, event) => sum + (event.participants.length || 0), 0);
  const ongoingEvents = events.filter(event => event.status === 'active').length;
  const totalExpenses = '₹15,000';

  if (loading) {
    return <Text>Loading dashboard...</Text>;
  }

  return (
    <Box p={5}>
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={10} mb={10}>
        <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Total Events</StatLabel>
          <StatNumber>{totalEvents}</StatNumber>
          <StatHelpText>All events in system</StatHelpText>
        </Stat>
        <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Total Participants</StatLabel>
          <StatNumber>{totalParticipants.toLocaleString()}</StatNumber>
          <StatHelpText>Across all events</StatHelpText>
        </Stat>
        <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Ongoing Events</StatLabel>
          <StatNumber>{ongoingEvents}</StatNumber>
          <StatHelpText>Currently active</StatHelpText>
        </Stat>
        <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Total Expenses</StatLabel>
          <StatNumber>{totalExpenses}</StatNumber>
          <StatHelpText>This month (mock)</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Text fontSize="2xl" fontWeight="bold" mb={4}>Events</Text>
      {events.length === 0 ? (
        <Text>No events found</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Event Title</Th>
              <Th>Participants</Th>
              <Th>Capacity</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {events.map((event) => (
              <Tr key={event.id}>
                <Td>{event.title}</Td>
                <Td>{event.participants.length}</Td>
                <Td>{event.capacity}</Td>
                <Td>
                  <Badge colorScheme={event.status === 'active' ? 'green' : 'yellow'}>
                    {event.status}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="yellow"
                    mr={2}
                    onClick={() => handleEditEvent(event)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    mr={2}
                    onClick={() => handleViewSummary(event)}
                  >
                    View Summary
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Summary Modal */}
      <Modal isOpen={isSummaryOpen} onClose={onSummaryClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Event Summary</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedEvent && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold">Event: {selectedEvent.title}</Text>
                  <Text>Participants: {selectedEvent.participants.length}</Text>
                  <Text>Capacity: {selectedEvent.capacity}</Text>
                  <Text>
                    Status: {' '}
                    <Badge colorScheme={selectedEvent.status === 'active' ? 'green' : 'yellow'}>
                      {selectedEvent.status}
                    </Badge>
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={2}>Participants List:</Text>
                  {selectedEvent.participants.length > 0 ? (
                    <VStack align="stretch" spacing={2}>
                      {selectedEvent.participants.map((participant, index) => (
                        <Box key={participant.id || index} p={2} border="1px" borderColor="gray.200" borderRadius="md">
                          <Text>Name: {participant.name}</Text>
                          <Text>Email: {participant.email}</Text>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text>No participants registered yet.</Text>
                  )}
                </Box>
                <Box>
                  <Button
                    colorScheme="purple"
                    onClick={handleGenerateReport}
                    isLoading={loadingReport}
                    mt={4}
                  >
                    Generate Event Report
                  </Button>
                  {reportContent && (
                    <Box mt={4}>
                      <Text fontWeight="bold">Event Report:</Text>
                      <Box
                        border="1px"
                        borderColor="gray.200"
                        p={4}
                        borderRadius="md"
                        whiteSpace="pre-wrap"
                        fontFamily="monospace"
                        fontSize="sm"
                      >
                        {reportContent}
                      </Box>
                      <Button
                        colorScheme="green"
                        mt={2}
                        onClick={downloadPdf}
                      >
                        Download PDF
                      </Button>
                    </Box>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onSummaryClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Event</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Event Title</FormLabel>
                <Input
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="datetime-local"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Location</FormLabel>
                <Input
                  value={editData.location}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  placeholder="Enter event location"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Capacity</FormLabel>
                <Input
                  type="number"
                  value={editData.capacity}
                  onChange={(e) => setEditData({ ...editData, capacity: e.target.value })}
                  placeholder="Enter maximum capacity"
                  min="1"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Enter event description"
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleUpdateEvent}>
              Save Changes
            </Button>
            <Button onClick={onEditClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Dashboard;