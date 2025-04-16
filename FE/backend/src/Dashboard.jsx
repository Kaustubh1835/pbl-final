import { Box, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';

function Dashboard() {
  return (
    <Box>
      <SimpleGrid columns={4} spacing={10}>
        <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Total Events</StatLabel>
          <StatNumber>12</StatNumber>
          <StatHelpText>Active events this month</StatHelpText>
        </Stat>
        <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Total Participants</StatLabel>
          <StatNumber>1,500</StatNumber>
          <StatHelpText>Across all events</StatHelpText>
        </Stat>
        <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Ongoing Events</StatLabel>
          <StatNumber>5</StatNumber>
          <StatHelpText>Currently active</StatHelpText>
        </Stat>
        <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md">
          <StatLabel>Total Expenses</StatLabel>
          <StatNumber>₹15,000</StatNumber>
          <StatHelpText>This month</StatHelpText>
        </Stat>
      </SimpleGrid>
    </Box>
  );
}

export default Dashboard