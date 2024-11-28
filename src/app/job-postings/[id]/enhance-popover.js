"use client";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"

import { Button } from "@/components/ui/button"
import { Wand2 } from "lucide-react"


export default function EnhanceJobPopover({ jobPosting }) {
    const handleEnhance = async () => {
      try {
        const response = await fetch('/api/enhance-job', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId: jobPosting.id,
            currentData: jobPosting
          }),
        });
        
        if (response.ok) {
          // Refresh the page to show updated data
          window.location.reload();
        }
      } catch (error) {
        console.error('Error enhancing job:', error);
      }
    };
  
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline">
            <Wand2/>
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 mx-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Enhance Job Posting</h4>
              <p className="text-sm text-muted-foreground">
                Use AI to fill in missing information
              </p>
            </div>
            <Button onClick={handleEnhance}>Enhance Job Details</Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }