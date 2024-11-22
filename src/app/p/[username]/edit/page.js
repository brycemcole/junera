"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function Textarea19(props) {
    const textareaRef = useRef(null);
    const defaultRows = 1;
    const maxRows = undefined; // You can set a max number of rows

    const handleInput = (e) => {
        const textarea = e.target;
        textarea.style.height = "auto";

        const style = window.getComputedStyle(textarea);
        const borderHeight = parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth);
        const paddingHeight = parseInt(style.paddingTop) + parseInt(style.paddingBottom);

        const lineHeight = parseInt(style.lineHeight);
        const maxHeight = maxRows ? lineHeight * maxRows + borderHeight + paddingHeight : Infinity;

        const newHeight = Math.min(textarea.scrollHeight + borderHeight, maxHeight);

        textarea.style.height = `${newHeight}px`;
    };

    useEffect(() => {
        if (textareaRef.current) {
            handleInput({ target: textareaRef.current });
        }
    }, [props.value]);

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
}

export default function EditProfilePage({ params }) {
  const { username } = params;
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    desired_job_title: '',
    professionalSummary: '',
  });
  const [message, setMessage] = useState('');

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
        });
      }
    };
    fetchProfile();
  }, [loading, user, username, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer {user.token}`,
      },
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      setMessage('Profile updated successfully.');
      router.push(`/p/${username}`);
    } else {
      setMessage('Failed to update profile.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
        {message && <p className="mb-4 text-green-500">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstname">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded"
              required
            />
          </div>
          <div>
            <Label htmlFor="lastname">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded"
              required
            />
          </div>
          <div>
            <Label htmlFor="desired_job_title">
              Job Title
            </Label>
            <Input
              type="text"
              name="desired_job_title"
              value={formData.desired_job_title}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Professional Summary</label>
            <Textarea19
              name="professionalSummary"
              value={formData.professionalSummary}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded"
            ></Textarea19>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}