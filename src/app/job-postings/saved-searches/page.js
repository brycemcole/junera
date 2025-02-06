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
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { X, Search, Bell, MapPin, Briefcase, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Plus } from "lucide-react";
import { useState } from 'react'
import { ToastAction } from "@/components/ui/toast";

const SavedSearchCard = ({ search, onEdit, onDelete }) => {
  const router = useRouter();
  console.log(search);

  const redirectToSearch = () => {
    const { title = "", location, experienceLevel } = search.search_criteria;
    router.push(`/job-postings?title=${title}&location=${location}&explevel=${experienceLevel}`);
  };

  return (
    <Card className="w-full max-w-md mx-auto hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2 pl-2 pr-2 pt-1 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Button variant="ghost" size="icon" className="hover:text-destructive/80" onClick={redirectToSearch}>
              <Search className="w-4 h-4 text-primary" />
            </Button>
            {search?.search_name}
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:text-destructive/80">
                <X className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this saved search? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(search.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-2 pt-0 text-sm">
        <p className="text-muted-foreground">
          <strong className="text-foreground">{search?.search_criteria.title || 'Any'}</strong> jobs in <strong className="text-foreground">{search?.search_criteria.location || 'Any location'}</strong> requiring <strong className="text-foreground">{search?.search_criteria.experienceLevel || 'Any'}</strong> experience level.
        </p>

        <div className="flex items-center gap-3">
          <Bell className={`w-4 h-4 ${search?.notify ? 'text-green-500' : 'text-muted-foreground'}`} />
          <div>
            <p className="font-medium">
              {search?.notify ? "You will receive alerts." : "You will not receive alerts."}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-2 pb-2">
        <Button onClick={() => onEdit(search)} variant="outline" className="w-full">
          Edit Search
        </Button>
      </CardFooter>
    </Card>
  );
};


const SavedSearchesList = ({
  savedSearches,
  setEditingSearch,
  handleDelete
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {savedSearches.map(search => (
        <SavedSearchCard
          key={search.id}
          search={search}
          onEdit={setEditingSearch}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

export default function SavedSearchPage() {
  const { user, loading } = useAuth(); // Destructure loading
  const router = useRouter();
  const [editingSearch, setEditingSearch] = useState(null)
  const [savedSearches, setSavedSearches] = useState([]);
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateSubmit = async (newData) => {
    try {
      // Ensure jobTitle has a value, even if empty string
      const searchCriteria = {
        title: newData.jobTitle || '',  // Changed from jobTitle to title for consistency
        location: newData.location || '',
        experienceLevel: newData.experienceLevel || ''
      };

      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          searchName: newData.searchName,
          searchCriteria,
          notify: newData.notify
        }),
      });

      if (response.ok) {
        const savedSearch = await response.json();
        setSavedSearches(prev => [...prev, savedSearch]);
        toast({ title: 'Saved search created successfully.' });
        setIsCreateDialogOpen(false);
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
  }, [user, loading, router, toast]); // Added toast to dependencies

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
      const searchCriteria = {
        title: updatedData.jobTitle || '',  // Changed from title to jobTitle to match form
        location: updatedData.location || '',
        experienceLevel: updatedData.experienceLevel || ''
      };

      const response = await fetch('/api/saved-searches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          id: editingSearch.id,
          searchName: updatedData.searchName,
          searchCriteria,  // Send as object, not stringified
          notify: updatedData.notify
        }),
      });

      if (response.ok) {
        // Refresh the saved searches after successful edit
        const refreshResponse = await fetch('/api/saved-searches', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setSavedSearches(data.savedSearches);
          toast({ title: 'Saved search updated successfully.' });
        }
        setEditingSearch(null);
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: errorData.error || 'Failed to update saved search.'
        });
      }
    } catch (error) {
      console.error('Error updating saved search:', error);
      toast({
        variant: "destructive",
        title: 'An error occurred while updating the saved search.'
      });
    }
  }

  async function handleDelete(id) {
    try {
      const response = await fetch(`/api/saved-searches`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        // Refresh the saved searches after deletion
        const refreshResponse = await fetch('/api/saved-searches', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setSavedSearches(data.savedSearches);
          toast({
            title: "Saved search deleted.",
            description: "The saved search has been successfully deleted.",
          });
        }
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: errorData.error || 'Failed to delete saved search.'
        });
      }
    } catch (error) {
      console.error('Error deleting saved search:', error);
      toast({
        variant: "destructive",
        title: 'An error occurred while deleting the saved search.'
      });
    }
  }

  return (
    <div className="container mx-auto md:py-10 px-4 max-w-4xl">
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


      {savedSearches.length > 0 && (
        <SavedSearchesList
          savedSearches={savedSearches}
          setEditingSearch={setEditingSearch}
          handleDelete={handleDelete}
        />
      )}
      {savedSearches.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No saved searches found. Create one to get started!
        </div>
      )}


      {editingSearch && (
        <Dialog open={!!editingSearch} onOpenChange={() => setEditingSearch(null)}>
          <DialogContent className="mr-4 sm:mr-0">
            <DialogHeader>
              <DialogTitle>Edit Saved Search</DialogTitle>
              <DialogDescription>
                Update the details of your saved search.
              </DialogDescription>
            </DialogHeader>
            <SavedSearchForm
              onSubmit={handleEditSubmit}
              initialData={{
                id: editingSearch.id,
                searchName: editingSearch.search_name,
                jobTitle: editingSearch.search_criteria.title,
                experienceLevel: editingSearch.search_criteria.experienceLevel,
                location: editingSearch.search_criteria.location,
                notify: editingSearch.notify
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}