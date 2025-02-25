import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronDown } from "lucide-react";

const getMatchScoreColor = (score) => {
  if (!score) return 'text-muted-foreground';
  
  switch (score.toLowerCase()) {
    case 'high':
      return 'border-green-600/20 bg-green-500/10 text-green-600';
    case 'medium':
      return 'border-yellow-600/20 bg-yellow-500/10 text-yellow-600';
    case 'low':
      return 'border-orange-600/20 bg-orange-500/10 text-orange-600';
    default:
      return 'text-muted-foreground';
  }
};

export function MatchAnalysis({ agentNote, showFullAnalysis, onToggleAnalysis }) {
  if (!agentNote) return null;

  return (
    <div className="rounded-lg border bg-card text-card-foreground cursor-pointer transition-all">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">Match Analysis</span>
            <Badge variant="secondary" className={getMatchScoreColor(agentNote.match_score)}>
              {agentNote.match_score} Match
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleAnalysis}>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFullAnalysis ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        {showFullAnalysis && (
          <div className="mt-4 text-sm text-muted-foreground">
            {agentNote.explanation}
          </div>
        )}
      </div>
    </div>
  );
}