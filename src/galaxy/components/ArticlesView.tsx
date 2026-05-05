import { 
  Newspaper, 
  Send, 
  User, 
  Clock, 
  MapPin, 
  Globe, 
  Shield, 
  Grid3X3,
  Plus,
  ArrowLeft,
  Search,
  MessageSquare,
  Building2,
  ThumbsUp,
  ThumbsDown,
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignJustify,
  Palette,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const CommentIcon = MessageSquare;
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface ArticlesViewProps {
  app: any;
  onPlayClick?: () => void;
}

export function ArticlesView({ app, onPlayClick }: ArticlesViewProps) {
  const { articles, createArticle, voteArticle, postComment, playerSystemId, galaxy, user } = app;
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);
  
  const currentSystem = galaxy.systemById[playerSystemId];
  const currentEmpire = galaxy.empires.find(e => e.id === currentSystem?.ownerId);
  
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("galaxy");

  const TABS = [
    { id: "all", label: "Subspace Feed", icon: NetworkIcon },
    { id: "galaxy", label: "Galactic News", icon: Globe },
    { id: "sector", label: "Sector Reports", icon: Grid3X3 },
    { id: "empire", label: "Empire Edicts", icon: Shield },
    { id: "system", label: "Local Comms", icon: MapPin },
  ];

  const filteredArticles = useMemo(() => {
    if (activeTab === "all") return articles;
    return articles.filter((a: any) => a.type === activeTab);
  }, [articles, activeTab]);

  const handleSubmit = async () => {
    if (!newTitle || !newContent) return;
    await createArticle(newTitle, newContent, newType);
    setNewTitle("");
    setNewContent("");
    setIsCreating(false);
  };

  const insertTag = (tag: string, value?: string) => {
    const textarea = document.getElementById("article-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    let replacement = "";
    switch(tag) {
      case 'b': replacement = `**${selected}**`; break;
      case 'i': replacement = `*${selected}*`; break;
      case 'u': replacement = `__${selected}__`; break;
      case 'j': replacement = `[[j]]${selected}[[/j]]`; break;
      case 'center': replacement = `[[center]]${selected}[[/center]]`; break;
      case 'right': replacement = `[[right]]${selected}[[/right]]`; break;
      case 'color': replacement = `[[color:${value}]]${selected}[[/color]]`; break;
      case 'img': replacement = `[[img:${value || 'url'}]]`; break;
    }
    
    setNewContent(before + replacement + after);
    textarea.focus();
  };

  return (
    <div className="flex-1 bg-background/40 backdrop-blur-sm p-4 sm:p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-2 duration-500">
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Header & Tabs */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-primary/20 pb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
                <Newspaper className="text-primary" size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-display text-white tracking-[0.2em] uppercase text-glow leading-none mb-2">Communication Hub</h2>
                <p className="text-xs font-mono-hud text-muted-foreground uppercase tracking-[0.3em]">Interstellar Subspace Relay System</p>
              </div>
            </div>
            <Button 
              className="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-display text-[10px] uppercase tracking-widest h-10 px-6"
              onClick={() => { onPlayClick?.(); setIsCreating(!isCreating); }}
            >
              {isCreating ? <ArrowLeft size={14} className="mr-2" /> : <Plus size={14} className="mr-2" />}
              {isCreating ? "Back to Feed" : "Compose Broadcast"}
            </Button>
          </div>

          {!isCreating && (
            <div className="flex flex-wrap gap-2">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { onPlayClick?.(); setActiveTab(tab.id); }}
                    className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all border font-mono-hud text-[10px] uppercase tracking-widest ${activeTab === tab.id ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' : 'bg-black/40 border-primary/10 hover:border-primary/30'}`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {isCreating ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="hud-panel p-8 border border-primary/20 bg-primary/5 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] block border-b border-primary/10 pb-2">Broadcast Directive</label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'galaxy', label: 'Galaxy Wide', icon: Globe, sub: 'Universal propagation', enabled: true },
                        { id: 'sector', label: 'Sector Specific', icon: Grid3X3, sub: currentSystem?.sectorId || 'Out of Range', enabled: !!currentSystem?.sectorId },
                        { id: 'empire', label: 'Imperial Edict', icon: Shield, sub: currentEmpire?.name || 'Independent Space', enabled: !!currentSystem?.ownerId },
                        { id: 'system', label: 'Local System', icon: MapPin, sub: currentSystem?.name || 'Deep Space', enabled: !!currentSystem?.name }
                      ].map(type => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            disabled={!type.enabled}
                            onClick={() => setNewType(type.id)}
                            className={`flex items-center gap-4 p-4 rounded-md border text-left transition-all relative overflow-hidden group ${!type.enabled ? 'opacity-30 grayscale cursor-not-allowed border-muted-foreground/10' : newType === type.id ? 'bg-primary/20 border-primary shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-black/40 border-primary/10 hover:border-primary/30'}`}
                          >
                            <div className={`p-2 rounded bg-primary/5 border border-primary/10 ${newType === type.id ? 'text-primary' : 'text-muted-foreground'}`}>
                              <Icon size={20} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={`text-[11px] font-bold uppercase tracking-widest ${newType === type.id ? 'text-primary' : 'text-muted-foreground'}`}>{type.label}</span>
                              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-tighter truncate">{type.sub}</span>
                            </div>
                            {!type.enabled && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest border border-muted-foreground/20 px-1.5 py-0.5 rounded">OFFLINE</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 flex flex-col">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] block border-b border-primary/10 pb-2">Headline</label>
                    <input 
                      type="text" 
                      placeholder="Enter transmission headline..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-black/60 border border-primary/20 rounded-md p-4 text-sm text-white focus:border-primary outline-none transition-all font-display tracking-widest placeholder:opacity-30"
                    />
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col">
                    <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                      <label className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Encrypted Message</label>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => insertTag('b')} className="p-1.5 rounded hover:bg-primary/10 border border-primary/10 text-[10px] font-bold text-primary uppercase w-8 h-8 flex items-center justify-center" title="Bold">B</button>
                        <button onClick={() => insertTag('i')} className="p-1.5 rounded hover:bg-primary/10 border border-primary/10 text-[10px] italic font-serif text-primary w-8 h-8 flex items-center justify-center" title="Italic">I</button>
                        <button onClick={() => insertTag('u')} className="p-1.5 rounded hover:bg-primary/10 border border-primary/10 text-[10px] underline text-primary w-8 h-8 flex items-center justify-center" title="Underline">U</button>
                        <div className="w-px h-6 bg-primary/10 mx-1 self-center" />
                        <button onClick={() => insertTag('center')} className="p-1.5 rounded hover:bg-primary/10 border border-primary/10 text-primary w-8 h-8 flex items-center justify-center" title="Center"><AlignCenter size={14} /></button>
                        <button onClick={() => insertTag('right')} className="p-1.5 rounded hover:bg-primary/10 border border-primary/10 text-primary w-8 h-8 flex items-center justify-center" title="Right"><AlignRight size={14} /></button>
                        <button onClick={() => insertTag('j')} className="p-1.5 rounded hover:bg-primary/10 border border-primary/10 text-primary w-8 h-8 flex items-center justify-center" title="Justify"><AlignJustify size={14} /></button>
                        <div className="w-px h-6 bg-primary/10 mx-1 self-center" />
                        <div className="relative group">
                           <button className="p-1.5 rounded hover:bg-primary/10 border border-primary/10 text-primary w-8 h-8 flex items-center justify-center" title="Text Color"><Palette size={14} /></button>
                           <input type="color" onChange={(e) => insertTag('color', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <button onClick={() => {
                          const url = prompt("Enter Image URL:");
                          if (url) insertTag('img', url);
                        }} className="p-1.5 rounded hover:bg-primary/10 border border-primary/10 text-primary w-8 h-8 flex items-center justify-center" title="Insert Image"><ImageIcon size={14} /></button>
                      </div>
                    </div>
                    <textarea 
                      id="article-content"
                      placeholder="Input message body for subspace transmission..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full flex-1 min-h-[300px] bg-black/60 border border-primary/20 rounded-md p-4 text-sm text-white focus:border-primary outline-none transition-all resize-none leading-relaxed font-mono-hud placeholder:opacity-30"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-primary/10">
                <Button 
                  variant="ghost" 
                  className="text-muted-foreground hover:text-white font-mono-hud text-[10px] uppercase tracking-widest"
                  onClick={() => setIsCreating(false)}
                >
                  Discard Signal
                </Button>
                <Button 
                  className="bg-primary text-primary-foreground px-10 font-display text-[11px] uppercase tracking-[0.2em] h-12 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                  onClick={handleSubmit}
                  disabled={!newTitle || !newContent}
                >
                  Initiate Broadcast <Send size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article: any) => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  onVote={voteArticle}
                  onComment={postComment}
                  user={user}
                />
              ))
            ) : (
              <div className="hud-panel py-32 text-center border border-dashed border-primary/20 rounded-lg bg-primary/5">
                <MessageSquare size={64} className="mx-auto text-primary/10 mb-6" />
                <p className="text-primary/40 uppercase tracking-[0.3em] text-sm font-bold italic">No broadcasts detected on this frequency</p>
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest mt-4">Monitoring subspace for incoming signals...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article, onVote, onComment, user }: { article: any, onVote: any, onComment: any, user: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(false);

  const TypeIcon = {
    galaxy: Globe,
    sector: Grid3X3,
    empire: Shield,
    system: MapPin
  }[article.type as 'galaxy' | 'sector' | 'empire' | 'system'] || Globe;

  const upvotes = article.article_votes?.filter((v: any) => v.vote_type === 1).length || 0;
  const downvotes = article.article_votes?.filter((v: any) => v.vote_type === -1).length || 0;
  const userVote = article.article_votes?.find((v: any) => v.user_id === user?.id)?.vote_type;

  const renderContent = (text: string, truncate: boolean = false) => {
    let content = text;
    if (truncate && text.length > 300) {
      content = text.substring(0, 300) + "...";
    }

    return content
      .split('\n')
      .map((line, i) => {
        // Handle Alignment Tags
        let alignClass = "";
        let lineContent = line;
        
        if (lineContent.includes('[[j]]')) { alignClass = "text-justify"; lineContent = lineContent.replace(/\[\[j\]\]|\[\[\/j\]\]/g, ""); }
        if (lineContent.includes('[[center]]')) { alignClass = "text-center"; lineContent = lineContent.replace(/\[\[center\]\]|\[\[\/center\]\]/g, ""); }
        if (lineContent.includes('[[right]]')) { alignClass = "text-right"; lineContent = lineContent.replace(/\[\[right\]\]|\[\[\/right\]\]/g, ""); }

        return (
          <div key={i} className={`mb-2 last:mb-0 ${alignClass}`}>
            {lineContent.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|\[\[color:.*?\]\].*?\[\[\/color\]\]|\[\[img:.*?\]\])/g).map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={j} className="italic text-primary/80">{part.slice(1, -1)}</em>;
              }
              if (part.startsWith('__') && part.endsWith('__')) {
                return <span key={j} className="underline decoration-primary/40 underline-offset-4">{part.slice(2, -2)}</span>;
              }
              if (part.startsWith('[[color:')) {
                const colorMatch = part.match(/\[\[color:(.*?)\]\](.*?)\[\[\/color\]\]/);
                if (colorMatch) {
                  return <span key={j} style={{ color: colorMatch[1] }}>{colorMatch[2]}</span>;
                }
              }
              if (part.startsWith('[[img:')) {
                const url = part.slice(6, -2);
                return <img key={j} src={url} alt="Broadcast Attachment" className="max-w-full rounded border border-primary/20 my-4 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]" />;
              }
              return part;
            })}
          </div>
        );
      });
  };

  return (
    <div className={`hud-panel border transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${isExpanded ? 'border-primary/40 bg-primary/10 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]' : 'border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/8'}`}>
      <div className="p-6">
        <div className="flex justify-between items-start gap-4 mb-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 flex items-center gap-1.5">
                <TypeIcon size={10} className="text-primary" />
                <span className="text-[8px] font-bold text-primary uppercase tracking-[0.1em]">{article.type}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono-hud uppercase tracking-widest flex items-center gap-1">
                <Clock size={10} /> {formatDistanceToNow(new Date(article.created_at))} ago
              </span>
            </div>
            <h3 className="text-lg font-display text-white tracking-wider uppercase group-hover:text-primary transition-colors">{article.title}</h3>
          </div>
          <div className="flex flex-col items-end shrink-0">
             <div className="flex items-center gap-2 text-primary/70 mb-1">
                <User size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{article.profiles?.commander_name || "Unknown Link"}</span>
             </div>
             <div className="text-[8px] text-muted-foreground/60 uppercase tracking-tighter">Broadcast Origin: Subspace Relay</div>
          </div>
        </div>
        
        <div className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border-l-2 border-primary/10 pl-4 py-1 italic transition-all ${isExpanded ? '' : 'max-h-24 overflow-hidden mask-fade-bottom'}`}>
          {renderContent(article.content, !isExpanded)}
        </div>

        {!isExpanded && article.content.length > 300 && (
          <button onClick={() => setIsExpanded(true)} className="mt-2 text-[9px] text-primary font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
             Read Full Transmission <ChevronDown size={10} />
          </button>
        )}

        {/* Action Bar */}
        <div className="mt-6 pt-4 border-t border-primary/10 flex justify-between items-center">
           <div className="flex gap-6">
              {/* Voting */}
              <div className="flex items-center gap-4 bg-black/40 rounded-full px-4 py-1 border border-primary/10">
                <button 
                  onClick={() => onVote(article.id, 1)}
                  className={`flex items-center gap-1.5 text-[10px] font-bold transition-all ${userVote === 1 ? 'text-success' : 'text-muted-foreground hover:text-success'}`}
                >
                  <ThumbsUp size={12} fill={userVote === 1 ? "currentColor" : "none"} /> {upvotes}
                </button>
                <div className="w-px h-3 bg-primary/10" />
                <button 
                  onClick={() => onVote(article.id, -1)}
                  className={`flex items-center gap-1.5 text-[10px] font-bold transition-all ${userVote === -1 ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                >
                  <ThumbsDown size={12} fill={userVote === -1 ? "currentColor" : "none"} /> {downvotes}
                </button>
              </div>

              <button 
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${showComments ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              >
                <CommentIcon size={12} /> {article.article_comments?.length || 0} Responses
              </button>
           </div>
           
           <div className="flex gap-4">
              <button className="flex items-center gap-1.5 text-[9px] text-muted-foreground hover:text-info transition-colors font-bold uppercase tracking-widest">
                <Send size={12} /> Retransmit
              </button>
              {isExpanded && (
                <button onClick={() => setIsExpanded(false)} className="flex items-center gap-1.5 text-[9px] text-primary hover:text-white transition-colors font-bold uppercase tracking-widest">
                   Collapse <ChevronUp size={12} />
                </button>
              )}
           </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-6 space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {article.article_comments?.map((comment: any) => (
                <div key={comment.id} className="hud-panel p-3 bg-white/5 border border-primary/10 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-primary uppercase">{comment.profiles?.commander_name || "Unknown"}</span>
                    <span className="text-[8px] text-muted-foreground uppercase">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">{comment.content}</p>
                </div>
              ))}
              {(!article.article_comments || article.article_comments.length === 0) && (
                <p className="text-center py-4 text-[9px] text-muted-foreground uppercase tracking-widest italic">No responses recorded in subspace</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Log response to transmission..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 bg-black/60 border border-primary/20 rounded p-2 text-xs text-white focus:border-primary outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentInput) {
                    onComment(article.id, commentInput);
                    setCommentInput("");
                  }
                }}
              />
              <Button 
                size="sm" 
                className="bg-primary/20 hover:bg-primary/40 border border-primary/30 h-9"
                onClick={() => {
                  if (commentInput) {
                    onComment(article.id, commentInput);
                    setCommentInput("");
                  }
                }}
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </svg>
  )
}
