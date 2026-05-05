import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { authService } from '../services/auth.service';
import { auth } from '../lib/auth';
import { motion } from 'framer-motion';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export const SignupPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      const response = await authService.register(data);
      if (response.success) {
        auth.setToken(response.data.token);
        auth.setUser(response.data.user);
        navigate('/dashboard');
      }
    } catch {
      alert('Signup failed. Please try again.');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto mt-12 sm:mt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-text-primary">Create Account</h1>
            <p className="text-text-secondary">Start organizing your AI project memory</p>
          </div>
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="name@example.com"
              />
              <Input
                label="Password"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                placeholder="••••••••"
              />
              <Button type="submit" className="w-full">Create Account</Button>
            </form>
            <div className="mt-6 text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-medium hover:underline">Login</Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};
