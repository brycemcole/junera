"use client";
const { useEffect } = require('react');
const { useAuth } = require('@/context/AuthContext');
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { SavedSearchForm } from './saved-search-form';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { Plus } from "lucide-react";
import { useState } from 'react'
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";
import { ToastDemo } from "@/components/toast-demo";
import { ToastAction } from "@/components/ui/toast";

export default function DashboardPage() {
    const { user, loading } = useAuth(); // Destructure loading
    const router = useRouter();
    const [editingSearch, setEditingSearch] = useState(null)
    const [savedSearches, setSavedSearches] = useState([]);
    const { toast } = useToast();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const handleCreateSubmit = async (newData) => {
        try {
            const response = await fetch('/api/saved-searches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ searchParams: newData }),
            });
            if (response.ok) {
                const savedSearch = await response.json(); // Expecting the saved search object
                setSavedSearches([...savedSearches, savedSearch]);
                toast({ title: 'Saved search created successfully.' });
                setIsCreateDialogOpen(false); // Close the dialog
            } else {
                const errorData = await response.json();
                toast({ title: errorData.error || 'Failed to create saved search.' });
            }
        } catch (error) {
            console.error('Error creating saved search:', error);
            toast({ title: 'An error occurred while creating the saved search.' });
        }
    };

    useEffect(() => {
      if (!loading) { // Check if loading is complete
        if (!user) {
          router.push('/login');
        } else {
          // Fetch saved searches
          fetch('/api/saved-searches', {
            headers: {
              'Authorization': `Bearer ${user.token}`, // Replace with actual token retrieval
            },
          })
            .then(response => response.json())
            .then(data => setSavedSearches(data.savedSearches)) // Updated to use savedSearches
            .catch(error => {
                console.error('Error fetching saved searches:', error);
                toast({ title: 'An error occurred while fetching saved searches.' });
                });
        }
      }
    }, [user, loading, router]); // Added loading to dependencies
  
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <svg
              className="animate-spin h-10 w-10 text-gray-600 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
    
    async function handleEditSubmit(updatedData) {
      try {
        const response = await fetch('/api/saved-searches', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`, // Corrected to use user.token
          },
          body: JSON.stringify({ id: editingSearch.id, searchParams: updatedData }),
        })
        if (response.ok) {
          toast({ title: 'Saved search updated successfully.' })
          setEditingSearch(null)
          // ...refresh data...
        } else {
          // ...handle error...
        }
      } catch (error) {
        // ...handle error...
      }
    }

    async function handleDelete(id) {
      try {
        const response = await fetch('/api/saved-searches', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`, // Replace with actual token retrieval
          },
          body: JSON.stringify({ id }),
        });
        if (response.ok) {
            toast({
                variant: "destructive",
                title: "Saved search deleted.",
                description: "The saved search has been successfully deleted.",
              })
          setSavedSearches(savedSearches.filter(search => search.id !== id));
        } else {
          const errorData = await response.json();
          toast({ title: errorData.error || 'Failed to delete saved search.' });
        }
      } catch (error) {
        console.error('Error deleting saved search:', error);
        toast({ title: 'An error occurred while deleting the saved search.' });
      }
    }

    return (
      <div className="container mx-auto py-10 p-4 max-w-4xl">
                <Breadcrumb className="mb-4">
        <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/job-postings">Jobs</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbPage>
        Saved Searches
    </BreadcrumbPage>
  </BreadcrumbList>
</Breadcrumb>
<div className="flex justify-between items-center justify-center  mb-6">
        <h1 className="text-3xl font-bold">Saved Searches</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
  <DialogTrigger>
    
  <Button onClick={() => setIsCreateDialogOpen(true)}>
      <Plus className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
      Create New
    </Button>
    </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Saved Search</DialogTitle>
      <DialogDescription>
        Fill out the form below to create a new saved search.
      </DialogDescription>
    </DialogHeader>
    <SavedSearchForm onSubmit={handleCreateSubmit} />
  </DialogContent>
</Dialog>
</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Render saved searches */}
          {savedSearches.map(search => {
            const params = JSON.parse(search.search_params); // Parse search_params
            return (
<div key={search.id} className="relative p-4 border rounded shadow-sm">
  {/* Delete 'x' button */}
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <button className="absolute top-2 right-2 text-sm hover:text-red-500">
        <X size={16} strokeWidth={2} />
      </button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. Are you sure you want to delete this saved search?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => handleDelete(search.id)}>
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  {/* Saved Search Details */}
  <div className="space-y-2">
    <div>
      <span className="block text-sm text-muted-foreground">Job Title</span>
      <span className="block text-lg font-semibold">{params.jobTitle}</span>
    </div>
    <div>
      <span className="block text-sm text-muted-foreground">Experience Level</span>
      <span className="block text-lg font-semibold">{params.experienceLevel}</span>
    </div>
    <div>
      <span className="block text-sm text-muted-foreground">Location</span>
      <span className="block text-lg font-semibold">{params.location}</span>
    </div>
  </div>

  {/* Edit Button */}
  <div className="mt-4">
    <Button variant="outline" onClick={() => setEditingSearch(search)} className="w-full">
      Edit
    </Button>
  </div>
</div>
            );
          })}
        </div>

        {editingSearch && (
          <Dialog open={!!editingSearch} onOpenChange={() => setEditingSearch(null)}>
            <DialogContent className="mr-4 sm:mr-0">
              <DialogHeader>
                <DialogTitle>Edit Saved Search</DialogTitle>
                <DialogDescription>
                  Update the details of your saved search.
                </DialogDescription>
              </DialogHeader>
              <SavedSearchForm onSubmit={handleEditSubmit} initialData={editingSearch.searchParams} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }