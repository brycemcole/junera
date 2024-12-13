import { useForm } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectLabel, SelectGroup } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect } from 'react';
import { Form, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"; // Ensure these are imported

export function SavedSearchForm({ onSubmit, initialData = {} }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      jobTitle: initialData.jobTitle || '',
      experienceLevel: initialData.experienceLevel || '',
      location: initialData.location || '',
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    reset({
      jobTitle: initialData.jobTitle || '',
      experienceLevel: initialData.experienceLevel || '',
      location: initialData.location || '',
    });
  }, [initialData, reset]);

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <FormItem>
        <FormLabel>Job Title</FormLabel>
        <FormControl>
          <Input {...register('jobTitle', { required: true })} />
        </FormControl>
        <FormMessage />
      </FormItem>

      <FormItem>
        <FormLabel>Experience Level</FormLabel>
        <FormControl>
          <Select {...register('experienceLevel', { required: true })}>
            <SelectTrigger>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Levels</SelectLabel>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="mid">Mid</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormItem>

      <FormItem>
        <FormLabel>Location</FormLabel>
        <FormControl>
          <Input {...register('location', { required: true })} />
        </FormControl>
        <FormMessage />
      </FormItem>

      <Button type="submit" className="mt-4">
        {initialData.jobTitle ? 'Update Search' : 'Create Search'}
      </Button>
    </Form>
  );
}