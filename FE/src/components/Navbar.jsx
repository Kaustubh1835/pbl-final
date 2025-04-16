import { Box, Flex, Button, Text } from '@chakra-ui/react';
import { FaUser } from 'react-icons/fa';

function Navbar() {
  return (
    <Box bg="blue.600" px={5} py={4}>
      <Flex maxW="1200px" mx="auto" justify="space-between" align="center">
        <Text fontSize="xl" fontWeight="bold" color="white">
          Event Hub
        </Text>
        <Button leftIcon={<FaUser />} colorScheme="whiteAlpha">
          My Profile
        </Button>
      </Flex>
    </Box>
  );
}

export default Navbar;