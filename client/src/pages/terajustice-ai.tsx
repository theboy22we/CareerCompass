import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Scale, 
  Search, 
  FileText, 
  Database, 
  Brain,
  Upload,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Gavel,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CaseData {
  id: string;
  title: string;
  caseType: string;
  status: 'active' | 'under_review' | 'resolved' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  parties: {
    plaintiff: string;
    defendant: string;
    witnesses?: string[];
  };
  evidence: Evidence[];
  timeline: TimelineEvent[];
  aiAnalysis: AIAnalysis;
  researchResults: ResearchResult[];
  createdAt: string;
  updatedAt: string;
}

interface Evidence {
  id: string;
  type: 'document' | 'testimony' | 'physical' | 'digital';
  title: string;
  description: string;
  source: string;
  relevanceScore: number;
  verificationStatus: 'verified' | 'pending' | 'disputed';
  uploadedAt: string;
}

interface TimelineEvent {
  id: string;
  date: string;
  event: string;
  source: string;
  importance: 'low' | 'medium' | 'high';
}

interface AIAnalysis {
  strengthScore: number;
  weaknesses: string[];
  recommendations: string[];
  precedents: Precedent[];
  riskAssessment: string;
  outcomeProjection: {
    favorableChance: number;
    neutralChance: number;
    unfavorableChance: number;
  };
}

interface Precedent {
  id: string;
  caseName: string;
  year: number;
  court: string;
  relevanceScore: number;
  outcome: string;
  keyPoints: string[];
}

interface ResearchResult {
  id: string;
  query: string;
  source: string;
  findings: string;
  relevanceScore: number;
  timestamp: string;
}

export default function TERJusticeAI() {
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [newCaseData, setNewCaseData] = useState({
    title: '',
    caseType: '',
    description: '',
    plaintiff: '',
    defendant: ''
  });
  const [researchQuery, setResearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all cases
  const { data: cases, isLoading } = useQuery({
    queryKey: ['/api/terajustice/cases'],
    refetchInterval: 30000,
  });

  // Fetch specific case details
  const { data: caseDetails } = useQuery({
    queryKey: ['/api/terajustice/cases', selectedCase],
    enabled: !!selectedCase,
  });

  // Create new case mutation
  const createCaseMutation = useMutation({
    mutationFn: (caseData: any) => apiRequest('/api/terajustice/cases', 'POST', caseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/terajustice/cases'] });
      setNewCaseData({ title: '', caseType: '', description: '', plaintiff: '', defendant: '' });
      toast({ title: "Case created successfully", description: "TERJustice AI is now analyzing the case." });
    },
  });

  // Research mutation
  const researchMutation = useMutation({
    mutationFn: (data: { caseId: string; query: string }) => 
      apiRequest('/api/terajustice/research', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/terajustice/cases', selectedCase] });
      setResearchQuery('');
      toast({ title: "Research completed", description: "New findings have been added to the case." });
    },
  });

  // Upload evidence mutation
  const uploadEvidenceMutation = useMutation({
    mutationFn: (data: { caseId: string; evidence: any }) => 
      apiRequest('/api/terajustice/evidence', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/terajustice/cases', selectedCase] });
      toast({ title: "Evidence uploaded", description: "AI analysis has been updated." });
    },
  });

  const handleCreateCase = () => {
    if (!newCaseData.title || !newCaseData.caseType || !newCaseData.description) {
      toast({ title: "Missing information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    createCaseMutation.mutate(newCaseData);
  };

  const handleResearch = () => {
    if (!selectedCase || !researchQuery) {
      toast({ title: "Missing information", description: "Please select a case and enter a research query.", variant: "destructive" });
      return;
    }
    researchMutation.mutate({ caseId: selectedCase, query: researchQuery });
  };

  // Mock data for display
  const defaultCases: CaseData[] = [
    {
      id: 'case-1',
      title: 'Community Housing Rights vs. Developer Corp',
      caseType: 'Civil Rights',
      status: 'active',
      priority: 'high',
      description: 'Community organization fighting against unfair housing development that displaces low-income families.',
      parties: {
        plaintiff: 'Community Housing Rights Coalition',
        defendant: 'Mega Developer Corp',
        witnesses: ['Jane Smith (Community Leader)', 'Dr. Robert Johnson (Urban Planning Expert)']
      },
      evidence: [
        {
          id: 'ev-1',
          type: 'document',
          title: 'Original Zoning Agreement',
          description: 'Document showing original community protection clauses',
          source: 'City Planning Department',
          relevanceScore: 95,
          verificationStatus: 'verified',
          uploadedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'ev-2',
          type: 'testimony',
          title: 'Community Impact Statements',
          description: 'Testimonies from 47 affected families',
          source: 'Community Interviews',
          relevanceScore: 88,
          verificationStatus: 'verified',
          uploadedAt: '2024-01-16T14:30:00Z'
        }
      ],
      timeline: [
        {
          id: 'tl-1',
          date: '2023-12-01',
          event: 'Developer announced project',
          source: 'Public Notice',
          importance: 'high'
        },
        {
          id: 'tl-2',
          date: '2024-01-10',
          event: 'Community filed complaint',
          source: 'Court Filing',
          importance: 'high'
        }
      ],
      aiAnalysis: {
        strengthScore: 78,
        weaknesses: [
          'Limited financial resources for extended litigation',
          'Developer has significant legal team',
          'Some zoning laws may favor development'
        ],
        recommendations: [
          'Focus on community impact evidence',
          'Seek pro bono legal support',
          'Build media awareness campaign',
          'Document all zoning violations'
        ],
        precedents: [
          {
            id: 'prec-1',
            caseName: 'Citizens vs. Metro Development',
            year: 2019,
            court: 'State Supreme Court',
            relevanceScore: 89,
            outcome: 'Favorable for community',
            keyPoints: ['Community rights prioritized', 'Developer compensation required', 'Zoning violations upheld']
          }
        ],
        riskAssessment: 'Moderate risk with strong community evidence. Key success factors: documentation quality and media support.',
        outcomeProjection: {
          favorableChance: 72,
          neutralChance: 18,
          unfavorableChance: 10
        }
      },
      researchResults: [
        {
          id: 'res-1',
          query: 'community housing rights precedents',
          source: 'Legal Database Search',
          findings: 'Found 23 similar cases with 68% favorable outcomes when strong community evidence is present.',
          relevanceScore: 92,
          timestamp: '2024-01-17T09:15:00Z'
        }
      ],
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-17T16:45:00Z'
    }
  ];

  const displayCases = (cases as CaseData[]) || defaultCases;
  const selectedCaseData = caseDetails || (selectedCase ? displayCases.find((c: CaseData) => c.id === selectedCase) : null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Scale className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <p>Loading TERJustice AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8 text-blue-500" />
            TERJustice AI
          </h1>
          <p className="text-muted-foreground">
            Advanced AI-Powered Legal Research and Case Analysis for Social Justice
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="default" className="text-lg px-3 py-1">
            AI Powered
          </Badge>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            Justice-Focused
          </Badge>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayCases.filter((c: CaseData) => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              Currently analyzing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Favorable outcomes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Queries</CardTitle>
            <Search className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              AI research completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evidence Analyzed</CardTitle>
            <Database className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,456</div>
            <p className="text-xs text-muted-foreground">
              Documents processed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">Case Management</TabsTrigger>
          <TabsTrigger value="research">AI Research</TabsTrigger>
          <TabsTrigger value="analysis">Case Analysis</TabsTrigger>
          <TabsTrigger value="create">Create Case</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Legal Research</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Case Analysis</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Precedent Search</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Risk Assessment</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Evidence Verification</span>
                    <Badge variant="secondary">Beta</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Current Focus Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    'Housing Rights & Displacement',
                    'Employment Discrimination',
                    'Environmental Justice',
                    'Police Accountability',
                    'Immigration Rights'
                  ].map((area, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{area}</span>
                      <Progress value={Math.random() * 100} className="w-20 h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  'New case analysis completed for Community Housing Rights',
                  'AI research found 23 relevant precedents for employment case',
                  'Evidence verification completed for 15 documents',
                  'Risk assessment updated for 3 active cases'
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{activity}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {Math.floor(Math.random() * 60)} mins ago
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cases Tab */}
        <TabsContent value="cases" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Case Management</h2>
            <Button onClick={() => setActiveTab('create')}>
              <FileText className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {displayCases.map((case_: CaseData) => (
                      <div
                        key={case_.id}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedCase === case_.id ? 'bg-muted' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedCase(case_.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={
                            case_.status === 'active' ? 'default' :
                            case_.status === 'resolved' ? 'secondary' : 'outline'
                          }>
                            {case_.status}
                          </Badge>
                          <Badge variant={
                            case_.priority === 'critical' ? 'destructive' :
                            case_.priority === 'high' ? 'default' : 'secondary'
                          }>
                            {case_.priority}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm">{case_.title}</h4>
                        <p className="text-xs text-muted-foreground">{case_.caseType}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCaseData ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedCaseData.title}</h3>
                      <p className="text-sm text-muted-foreground">{selectedCaseData.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Plaintiff</label>
                        <p className="text-sm">{selectedCaseData.parties.plaintiff}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Defendant</label>
                        <p className="text-sm">{selectedCaseData.parties.defendant}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">AI Strength Score</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={selectedCaseData.aiAnalysis.strengthScore} className="flex-1" />
                        <span className="text-sm font-medium">{selectedCaseData.aiAnalysis.strengthScore}%</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Evidence Count</label>
                      <p className="text-sm">{selectedCaseData.evidence.length} pieces of evidence</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Select a case to view details</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Research Tab */}
        <TabsContent value="research" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                AI Legal Research
              </CardTitle>
              <CardDescription>
                Conduct comprehensive legal research using AI-powered analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Case</label>
                <Select value={selectedCase} onValueChange={setSelectedCase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose case for research" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayCases.map((case_: CaseData) => (
                      <SelectItem key={case_.id} value={case_.id}>
                        {case_.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Research Query</label>
                <Textarea
                  placeholder="Enter your research question or topic (e.g., 'Find precedents for housing displacement cases', 'Research community rights legislation')"
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleResearch}
                disabled={!selectedCase || !researchQuery || researchMutation.isPending}
                className="w-full"
              >
                {researchMutation.isPending ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-spin" />
                    AI Researching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Start AI Research
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {selectedCaseData && selectedCaseData.researchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Research Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedCaseData.researchResults.map((result: ResearchResult) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.query}</h4>
                        <Badge variant="outline">
                          {result.relevanceScore}% relevant
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{result.source}</p>
                      <p className="text-sm">{result.findings}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {selectedCaseData ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Case Analysis: {selectedCaseData.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {selectedCaseData.aiAnalysis.outcomeProjection.favorableChance}%
                      </div>
                      <p className="text-sm text-muted-foreground">Favorable Outcome</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">
                        {selectedCaseData.aiAnalysis.outcomeProjection.neutralChance}%
                      </div>
                      <p className="text-sm text-muted-foreground">Neutral Outcome</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">
                        {selectedCaseData.aiAnalysis.outcomeProjection.unfavorableChance}%
                      </div>
                      <p className="text-sm text-muted-foreground">Unfavorable Outcome</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Case Strength Assessment</h4>
                    <Progress value={selectedCaseData.aiAnalysis.strengthScore} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Overall strength: {selectedCaseData.aiAnalysis.strengthScore}/100
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">AI Recommendations</h4>
                    <div className="space-y-2">
                      {selectedCaseData.aiAnalysis.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Identified Weaknesses</h4>
                    <div className="space-y-2">
                      {selectedCaseData.aiAnalysis.weaknesses.map((weakness: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{weakness}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Relevant Precedents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedCaseData.aiAnalysis.precedents.map((precedent: Precedent) => (
                      <div key={precedent.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{precedent.caseName} ({precedent.year})</h4>
                          <Badge variant="outline">
                            {precedent.relevanceScore}% relevant
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{precedent.court}</p>
                        <p className="text-sm mb-2"><strong>Outcome:</strong> {precedent.outcome}</p>
                        <div className="space-y-1">
                          {precedent.keyPoints.map((point: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs">{point}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Gavel className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select a case to view AI analysis</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Create Case Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Create New Case
              </CardTitle>
              <CardDescription>
                Input case information for AI analysis and research
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Case Title *</label>
                  <Input
                    placeholder="Enter case title"
                    value={newCaseData.title}
                    onChange={(e) => setNewCaseData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Case Type *</label>
                  <Select 
                    value={newCaseData.caseType} 
                    onValueChange={(value) => setNewCaseData(prev => ({ ...prev, caseType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select case type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="civil-rights">Civil Rights</SelectItem>
                      <SelectItem value="housing">Housing Rights</SelectItem>
                      <SelectItem value="employment">Employment</SelectItem>
                      <SelectItem value="environmental">Environmental Justice</SelectItem>
                      <SelectItem value="immigration">Immigration</SelectItem>
                      <SelectItem value="police-accountability">Police Accountability</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Plaintiff *</label>
                  <Input
                    placeholder="Enter plaintiff name"
                    value={newCaseData.plaintiff}
                    onChange={(e) => setNewCaseData(prev => ({ ...prev, plaintiff: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Defendant *</label>
                  <Input
                    placeholder="Enter defendant name"
                    value={newCaseData.defendant}
                    onChange={(e) => setNewCaseData(prev => ({ ...prev, defendant: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Case Description *</label>
                <Textarea
                  placeholder="Provide detailed case description, circumstances, and key issues"
                  value={newCaseData.description}
                  onChange={(e) => setNewCaseData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleCreateCase}
                disabled={createCaseMutation.isPending}
                className="w-full"
              >
                {createCaseMutation.isPending ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-spin" />
                    Creating & Analyzing Case...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Case & Start AI Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}