import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronDown } from "lucide-react";

const getMatchScoreStyles = (score) => {
  if (!score) return {};
  
  switch (score.toLowerCase()) {
    case 'high':
      return {
        badge: 'border-green-600/20 bg-green-500/10 text-green-600',
        container: 'border-green-500/20 bg-gradient-to-b from-green-50/5 to-transparent shadow-sm hover:shadow-lg hover:shadow-green-500/10 transition-all duration-200',
        button: 'border-green-500/20 text-green-600 hover:bg-green-500/10 hover:text-green-700',
        heading: 'text-green-700'
      };
    case 'medium':
      return {
        badge: 'border-yellow-600/20 bg-yellow-500/10 text-yellow-600',
        container: 'border-yellow-500/20 bg-gradient-to-b from-yellow-50/5 to-transparent shadow-sm hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-200',
        button: 'border-yellow-500/20 text-yellow-600 hover:bg-yellow-500/10 hover:text-yellow-700',
        heading: 'text-yellow-700'
      };
    case 'low':
      return {
        badge: 'border-orange-600/20 bg-orange-500/10 text-orange-600',
        container: 'border-orange-500/20 bg-gradient-to-b from-orange-50/5 to-transparent shadow-sm hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-200',
        button: 'border-orange-500/20 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700',
        heading: 'text-orange-700'
      };
    default:
      return {
        badge: 'border-muted text-muted-foreground',
        container: 'border-muted bg-muted/5',
        button: 'border-muted hover:bg-muted/10',
        heading: 'text-foreground'
      };
  }
};

export function MatchAnalysis({ agentNote, showFullAnalysis, onToggleAnalysis }) {
  if (!agentNote) return null;

  const styles = getMatchScoreStyles(agentNote.match_score);

  return (
    <div className={`rounded-xl border ${styles.container} p-6`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className={`h-4 w-4 ${styles.heading}`} />
            <span className={`font-medium ${styles.heading}`}>Match Analysis</span>
          </div>
          <Badge variant="outline" className={`${styles.badge} text-xs`}>
            {agentNote.match_score} Match
          </Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggleAnalysis}
          className={`${styles.button}`}
        >
          {showFullAnalysis ? 'Show Less' : 'Show More'}
          <ChevronDown className={`h-4 w-4 ml-1.5 transition-transform duration-200 ${showFullAnalysis ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      {showFullAnalysis && (
        <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {agentNote.explanation}
        </div>
      )}
    </div>
  );
}