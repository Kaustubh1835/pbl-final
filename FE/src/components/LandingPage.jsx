import { Box, Button, Heading, VStack, Text, Input, FormControl, FormLabel, Spinner, useToast } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useUserContext } from '../context/UserContext';

function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login } = useUserContext();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Handle Google OAuth redirect with detailed logging, fixed validation, and fallback
  useEffect(() => {
    console.log('useEffect triggered - Checking redirect URL:', location.pathname + location.search);
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');

    console.log('Params extracted - token:', token, 'error:', error);

    if (error) {
      console.log('Error parameter received in redirect:', error);
      toast({
        title: 'Google login failed!',
        description: `Error: ${error}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (token) {
      console.log('Token received from redirect:', token);
      if (token.split('.').length !== 3) { // Fixed JWT validation
        console.error('Invalid JWT format:', token);
        toast({
          title: 'Google login failed!',
          description: 'Invalid token format received',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      try {
        const decodedToken = jwtDecode(token);
        console.log('Decoded token:', JSON.stringify(decodedToken, null, 2));
        login(token, decodedToken); // Store token and decoded data in context
        const role = decodedToken.role || 'user'; // Default to 'user' if role is missing
        console.log('Decoded role:', role, 'Navigating to:', role === 'admin' ? '/admin' : '/events');
        toast({ title: 'Google login successful!', status: 'success', duration: 3000, isClosable: true });
        navigate(role === 'admin' ? '/admin' : '/events', { replace: true });
        console.log('Navigation attempted, current location:', location.pathname); // Debug log
      } catch (error) {
        console.error('Error decoding token:', error.message, error);
        toast({
          title: 'Google login failed!',
          description: `Invalid token received: ${error.message || 'Unknown error'}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        // Fallback: Navigate to a default page if decoding fails
        navigate('/events', { replace: true });
        console.log('Fallback navigation to /events due to decoding error');
      }
    } else {
      console.log('No token found in redirect URL params:', location.search);
    }
  }, [location, login, navigate, toast]);

  const handleLogin = async () => {
    if (!email || !password) {
      console.log('Validation failed: Missing email or password');
      toast({ title: 'Please enter email and password', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setLoading(true);
    console.log('Attempting login with email:', email);
    try {
      const response = await axios.post('http://localhost:3000/user/signin', { email, password });
      console.log('Signin response:', response.data);
      const { token } = response.data;
      if (!token) throw new Error('No token received from server');
      console.log('Login successful, received token:', token);
      const decodedToken = jwtDecode(token);
      login(token, decodedToken);
      const role = decodedToken.role || 'user';
      console.log('Navigating to role-based route:', role === 'admin' ? '/admin' : '/events');
      toast({ title: 'Login successful!', status: 'success', duration: 3000, isClosable: true });
      navigate(role === 'admin' ? '/admin' : '/events', { replace: true });
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message, error);
      toast({
        title: 'Login failed!',
        description: error.response?.data?.msg || error.message || 'An error occurred.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      console.log('Login attempt completed, loading set to false');
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !firstName || !lastName) {
      console.log('Validation failed: Missing required fields');
      toast({ title: 'Please fill in all fields', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setLoading(true);
    console.log('Attempting signup with email:', email, 'name:', firstName, lastName);
    try {//sea
      const response = await axios.post('http://localhost:3000/user/signup', { email, password, firstName, lastName });
      console.log('Signup response:', response.data);
      const { token } = response.data;
      if (!token) throw new Error('No token received from server');
      console.log('Signup successful, received token:', token);
      const decodedToken = jwtDecode(token);
      login(token, decodedToken);
      const role = decodedToken.role || 'user';
      console.log('Navigating to role-based route:', role === 'admin' ? '/admin' : '/events');
      toast({ title: 'Signup and login successful!', status: 'success', duration: 3000, isClosable: true });
      navigate(role === 'admin' ? '/admin' : '/events', { replace: true });
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message, error);
      toast({
        title: 'Signup failed!',
        description: error.response?.data?.msg || error.message || 'An error occurred.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      console.log('Signup attempt completed, loading set to false');
    }
  };

  // ✅ Google OAuth handler with logging
  const handleGoogleLogin = () => {
    const redirectUrl = 'http://localhost:3000/user/auth/google';
    console.log('Initiating Google OAuth redirect to:', redirectUrl);
    window.location.href = redirectUrl;
  };

  // Debug button to manually trigger navigation (remove in production)
  const handleDebugNavigation = () => {
    console.log('Debug navigation triggered to /events');
    navigate('/events', { replace: true });
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
      <VStack spacing={8} textAlign="center" p={8} bg="white" rounded="lg" shadow="md" maxW="400px" w="100%">
        <Heading size="2xl">{isLogin ? 'Login' : 'Signup'}</Heading>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            isRequired
          />
        </FormControl>
        <FormControl>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            isRequired
          />
        </FormControl>
        {!isLogin && (
          <>
            <FormControl>
              <FormLabel>First Name</FormLabel>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                isRequired
              />
            </FormControl>
            <FormControl>
              <FormLabel>Last Name</FormLabel>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                isRequired
              />
            </FormControl>
          </>
        )}
        <Button
          colorScheme="blue"
          size="lg"
          onClick={isLogin ? handleLogin : handleSignup}
          isDisabled={loading}
          w="full"
        >
          {loading ? <Spinner size="sm" /> : isLogin ? 'Login' : 'Signup'}
        </Button>
        {isLogin && (
          <Button
            colorScheme="red"
            size="lg"
            onClick={handleGoogleLogin}
            isDisabled={loading}
            w="full"
          >
            Sign in with Google
          </Button>
        )}
        <Text
          fontSize="md"
          color="gray.600"
          cursor="pointer"
          onClick={() => {
            setIsLogin(!isLogin);
            setFirstName('');
            setLastName('');
          }}
        >
          {isLogin ? "Don't have an account? Signup" : 'Already have an account? Login'}
        </Text>
        {/* Debug button - Remove in production */}
        
      </VStack>
    </Box>
  );
}

export default LandingPage;