import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserPlus, LogIn, Sparkles } from 'lucide-react';

const LoginCTA = ({ 
  title = "Unlock premium features", 
  description = "Create an account or log in to access more features.",
  features = [],
  className = "",
  variant = "default" // 'default', 'compact', or 'minimal'
}) => {
  const variants = {
    default: "rounded-lg border bg-card p-6 shadow-sm",
    compact: "rounded-lg border bg-card p-4",
    minimal: "rounded-lg bg-muted/50 p-4"
  };
  
  return (
    <div className={`${variants[variant] || variants.default} ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      
      {features.length > 0 && (
        <ul className="space-y-2 mb-5">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
      
      <div className="flex gap-3 flex-wrap">
        <Link href="/register">
          <Button variant="default" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Sign up
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" className="gap-2">
            <LogIn className="h-4 w-4" />
            Log in
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LoginCTA;
