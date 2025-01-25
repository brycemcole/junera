import { Users } from "lucide-react";

export const EmptyState = ({ type }) => {
    const messages = {
        experience: "No work experience added yet",
        education: "No education history added yet",
        projects: "No projects added yet",
        certifications: "No certifications added yet",
        profile: "This profile is still being set up"
    };

    return (
        <div className="text-center py-8 px-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">{messages[type]}</p>
        </div>
    );
};