"use client";
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Debounce utility
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Memoized Textarea component
const Textarea19 = memo(function Textarea19(props) {
  const textareaRef = useRef(null);
  const defaultRows = 1;
  const maxRows = undefined; // You can set a max number of rows

  const handleInput = useCallback((e) => {
    const textarea = e.target;
    textarea.style.height = "auto";

    const style = window.getComputedStyle(textarea);
    const borderHeight = parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth);
    const paddingHeight = parseInt(style.paddingTop) + parseInt(style.paddingBottom);

    const lineHeight = parseInt(style.lineHeight);
    const maxHeight = maxRows ? lineHeight * maxRows + borderHeight + paddingHeight : Infinity;

    const newHeight = Math.min(textarea.scrollHeight + borderHeight, maxHeight);

    textarea.style.height = `${newHeight}px`;
  }, [maxRows]);

  useEffect(() => {
    if (textareaRef.current) {
      handleInput({ target: textareaRef.current });
    }
  }, [props.value, handleInput]);

  return (
    <div className="space-y-2">
      <Label htmlFor="textarea-19">{props.label}</Label>
      <Textarea
        {...props}
        ref={textareaRef}
        onInput={handleInput}
      />
    </div>
  );
});

// Form input component
const FormInput = memo(({ label, name, type = "text", value, onChange, required = false, ...props }) => {
  return (
    <div>
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
    </div>
  );
});

FormInput.displayName = 'FormInput';

// Form textarea component
const FormTextarea = memo(({ label, name, value, onChange }) => {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Textarea19
        name={name}
        value={value}
        onChange={onChange}
      />
    </div>
  );
});

FormTextarea.displayName = 'FormTextarea';

export default function EditProfilePage({ params }) {
  const { username } = React.use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    desired_job_title: '',
    professionalSummary: '',
    employment_type: '',
    desired_location: '',
    willing_to_relocate: false,
    desired_salary_min: '',
    availability_date: '',
    skills: '',
    languages: '',
    certifications: '',
    preferred_industries: '',
    phone_number: '',
    soft_skills: '',
    technical_skills: '',
    other_skills: '',
    twitter: '',
    github_url: '',
    leetcode_url: '',
    link: '',
    link2: '',
    linkedin_url: ''
  });
  const [message, setMessage] = useState('');
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    if (!loading && user?.username !== username) {
      router.push('/login');
    }
    // Fetch existing profile data
    const fetchProfile = async () => {
      const response = await fetch(`/api/user/${username}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          firstname: data.firstname || '',
          lastname: data.lastname || '',
          desired_job_title: data.desired_job_title || '',
          professionalSummary: data.professionalSummary || '',
          employment_type: data.employment_type || '',
          desired_location: data.desired_location || '',
          willing_to_relocate: data.willing_to_relocate || false,
          desired_salary_min: data.desired_salary_min || '',
          availability_date: data.availability_date || '',
          skills: data.skills || '',
          languages: data.languages || '',
          certifications: data.certifications || '',
          preferred_industries: data.preferred_industries || '',
          phone_number: data.phone_number || '',
          soft_skills: data.soft_skills || '',
          technical_skills: data.technical_skills || '',
          other_skills: data.other_skills || '',
          twitter: data.twitter || '',
          github_url: data.github_url || '',
          leetcode_url: data.leetcode_url || '',
          link: data.link || '',
          link2: data.link2 || '',
          linkedin_url: data.linkedin_url || ''
        });
      }
    };
    fetchProfile();
  }, [loading, user, username, router]);

  // Debounced API update
  const updateProfile = useCallback((data) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          console.error('Failed to auto-save');
        }
      } catch (error) {
        console.error('Error auto-saving:', error);
      }
    }, 2000); // 2 second delay for API updates
  }, [user]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;

    // Update local state immediately
    setFormData(prev => {
      const newData = { ...prev, [name]: finalValue };
      // Trigger debounced API update
      updateProfile(newData);
      return newData;
    });
  }, [updateProfile]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    // Clear any pending auto-save
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Immediate save
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`,
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setMessage('Profile updated successfully.');
      router.push(`/p/${username}`);
    } else {
      setMessage('Failed to update profile.');
    }
  }, [formData, user, router, username]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
        {message && <p className="mb-4 text-green-500">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="First Name"
            name="firstname"
            value={formData.firstname}
            onChange={handleInputChange}
            required
          />
          <FormInput
            label="Last Name"
            name="lastname"
            value={formData.lastname}
            onChange={handleInputChange}
            required
          />
          <FormInput
            label="Job Title"
            name="desired_job_title"
            value={formData.desired_job_title}
            onChange={handleInputChange}
          />
          <FormTextarea
            label="Professional Summary"
            name="professionalSummary"
            value={formData.professionalSummary}
            onChange={handleInputChange}
          />
          <FormInput
            label="Employment Type"
            name="employment_type"
            value={formData.employment_type}
            onChange={handleInputChange}
          />
          <FormInput
            label="Desired Location"
            name="desired_location"
            value={formData.desired_location}
            onChange={handleInputChange}
          />
          <FormInput
            label="Willing to Relocate"
            name="willing_to_relocate"
            type="checkbox"
            className="h-4 w-4"
            checked={formData.willing_to_relocate}
            onChange={handleInputChange}
          />
          <FormInput
            label="Minimum Desired Salary"
            name="desired_salary_min"
            type="number"
            value={formData.desired_salary_min}
            onChange={handleInputChange}
          />
          <FormInput
            label="Availability Date"
            name="availability_date"
            type="date"
            value={formData.availability_date}
            onChange={handleInputChange}
          />
          <FormTextarea
            label="Skills"
            name="skills"
            value={formData.skills}
            onChange={handleInputChange}
          />
          <FormInput
            label="Languages"
            name="languages"
            value={formData.languages}
            onChange={handleInputChange}
          />
          <FormTextarea
            label="Certifications"
            name="certifications"
            value={formData.certifications}
            onChange={handleInputChange}
          />
          <FormInput
            label="Preferred Industries"
            name="preferred_industries"
            value={formData.preferred_industries}
            onChange={handleInputChange}
          />
          <FormInput
            label="Phone Number"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={handleInputChange}
          />
          <FormTextarea
            label="Soft Skills"
            name="soft_skills"
            value={formData.soft_skills}
            onChange={handleInputChange}
          />
          <FormTextarea
            label="Technical Skills"
            name="technical_skills"
            value={formData.technical_skills}
            onChange={handleInputChange}
          />
          <FormTextarea
            label="Other Skills"
            name="other_skills"
            value={formData.other_skills}
            onChange={handleInputChange}
          />
          <FormInput
            label="Twitter Username"
            name="twitter"
            value={formData.twitter}
            onChange={handleInputChange}
          />
          <FormInput
            label="GitHub Username"
            name="github_url"
            value={formData.github_url}
            onChange={handleInputChange}
          />
          <FormInput
            label="LeetCode Username"
            name="leetcode_url"
            value={formData.leetcode_url}
            onChange={handleInputChange}
          />
          <FormInput
            label="LinkedIn Username (the part after linkedin.com/)"
            name="linkedin_url"
            value={formData.linkedin_url}
            onChange={handleInputChange}
          />
          <FormInput
            label="Additional Link 1"
            name="link"
            type="url"
            value={formData.link}
            onChange={handleInputChange}
          />
          <FormInput
            label="Additional Link 2"
            name="link2"
            type="url"
            value={formData.link2}
            onChange={handleInputChange}
          />
          <Button
            type="submit"
            className="px-4 py-2"
          >
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}