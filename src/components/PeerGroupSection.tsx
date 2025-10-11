import { Users } from 'lucide-react';
import { Card } from './ui/card';

interface PeerGroupSectionProps {
  goals: any[];
  categories: any[];
}

export function PeerGroupSection({ goals, categories }: PeerGroupSectionProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="text-gray-900">Peer Support</h3>
        </div>
        <p className="text-gray-600 text-sm">
          Connect with peers on similar journeys for motivation and support.
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="bg-gray-50 border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Icon and Coming Soon Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-gray-900 mb-2">
              👋 Peer Support Groups Coming Soon!
            </h4>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm text-center leading-relaxed">
            We're building an intelligent algorithm to match you with peers who share similar goals and challenges. This feature will be available once we have enough users to form meaningful support groups.
          </p>

          {/* What to expect section */}
          <div className="space-y-3">
            <h5 className="text-purple-600 text-sm">What to expect:</h5>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-600 text-sm">
                  Small groups of 3-5 women with aligned <span className="text-purple-600">goals</span>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-600 text-sm">
                  Shared progress walls and celebrations
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-600 text-sm">
                  AI-facilitated conversations and discussions
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-600 text-sm">
                  Accountability partners for your journey
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}