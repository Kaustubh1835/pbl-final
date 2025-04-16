import { Box, Flex, Button, Text } from '@chakra-ui/react';
import { FaUser, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  return (
    <Box bg="blue.600" px={5} py={4}>
      <Flex maxW="1200px" mx="auto" justify="space-between" align="center">
        <Text fontSize="xl" fontWeight="bold" color="white">
          Event Hub
        </Text>
        <Flex gap={4}>
          <Button
            leftIcon={<FaHome />}
            colorScheme="whiteAlpha"
            onClick={() => navigate('/')}
          >
            Log Out
          </Button>
          {/* <Button leftIcon={<FaUser />} colorScheme="whiteAlpha">
            My Profile
          </Button> */}
        </Flex>
      </Flex>
    </Box>
  );
}

export default Navbar;