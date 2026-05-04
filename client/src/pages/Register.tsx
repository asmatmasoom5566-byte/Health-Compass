import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    profession: '',
    clinicHospital: '',
    inviteCode: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPassword] = useState(() => {
    // Generate a random 8-character password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  });

  const professions = [
    { value: 'doctor', label: 'Doctor' },
    { value: 'student', label: 'Medical Student' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'pharmacist', label: 'Pharmacist' },
    { value: 'other', label: 'Other Healthcare Professional' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.phone) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName: formData.fullName,
        phone: formData.phone,
        password: generatedPassword, // Use generated password
        profession: formData.profession,
        clinicHospital: formData.clinicHospital || undefined,
        inviteCode: formData.inviteCode || undefined,
      });

      setSuccess(`Registration successful! Your password is: ${generatedPassword}. Please save it securely. You can login after admin approval.`);
      
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create Your Account</CardTitle>
          <CardDescription className="text-center">
            Join our medical diagnosis platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Dr. John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profession *</Label>
                <Select
                  value={formData.profession}
                  onValueChange={(value) => setFormData({ ...formData, profession: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {professions.map((prof) => (
                      <SelectItem key={prof.value} value={prof.value}>
                        {prof.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">This will be your login credential</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="generatedPassword">Your Password (Auto-Generated)</Label>
                <Input
                  id="generatedPassword"
                  type="text"
                  value={generatedPassword}
                  readOnly
                  className="bg-gray-50 dark:bg-slate-800 font-mono text-lg"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ Save this password securely! It will be shown only once.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Confirm Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Re-enter the password shown above"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Verify Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password again"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clinicHospital">Clinic/Hospital (Optional)</Label>
                <Input
                  id="clinicHospital"
                  placeholder="City General Hospital"
                  value={formData.clinicHospital}
                  onChange={(e) => setFormData({ ...formData, clinicHospital: e.target.value })}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="inviteCode">Invite Code *</Label>
                <Input
                  id="inviteCode"
                  placeholder="Enter your invite code (required)"
                  value={formData.inviteCode}
                  onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase() })}
                  required
                  className="font-mono uppercase"
                  maxLength={20}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Invite codes are single-use and must be provided by an administrator
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Login here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
