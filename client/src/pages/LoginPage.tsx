import { useState } from 'react';
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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const response = await authService.login(data);
      if (response.success) {
        auth.setToken(response.data.token);
        auth.setUser(response.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
            <h1 className="text-3xl font-bold text-text-primary">Welcome Back</h1>
            <p className="text-text-secondary">Enter your details to access your vaults</p>
          </div>
          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs text-center">
                  {error}
                </div>
              )}
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
              <Button type="submit" className="w-full">Login</Button>
            </form>
            <div className="mt-6 text-center text-sm text-text-secondary">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-accent font-medium hover:underline">Sign up</Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};
