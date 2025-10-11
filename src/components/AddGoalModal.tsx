import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Target, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { goalCategories } from './GoalsScreen';

interface AddGoalModalProps {
  onClose: () => void;
  onSave: (goal: {
    title: string;
    description: string;
    category: string;
    timeframe: 'short' | 'long';
  }) => void;
  categories: typeof goalCategories;
}

export function AddGoalModal({ onClose, onSave, categories }: AddGoalModalProps) {
  const [step, setStep] = useState(1);
  const [timeframe, setTimeframe] = useState<'short' | 'long'>('short');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !selectedCategory) return;

    setIsGeneratingPlan(true);
    
    // Simulate AI plan generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onSave({
      title: title.trim(),
      description: description.trim(),
      category: selectedCategory,
      timeframe
    });
  };

  const canProceedToStep2 = timeframe;
  const canProceedToStep3 = selectedCategory;
  const canSave = title.trim() && selectedCategory;

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white border-0 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <h2 className="text-gray-900">Add New Goal</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="px-6 pt-4">
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                        step >= stepNumber 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div 
                        className={`w-12 h-0.5 mx-2 transition-colors ${
                          step > stepNumber ? 'bg-purple-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="px-6 pb-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-gray-900 mb-2">Choose timeframe</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        How long do you want to work on this goal?
                      </p>
                      
                      <div className="space-y-3">
                        <button
                          onClick={() => setTimeframe('short')}
                          className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                            timeframe === 'short'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-gray-900">Short-term</p>
                              <p className="text-gray-600 text-sm">≤ 3 months</p>
                            </div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setTimeframe('long')}
                          className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                            timeframe === 'long'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-gray-900">Long-term</p>
                              <p className="text-gray-600 text-sm">6–12 months</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-gray-900 mb-2">Choose category</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        What area of your life does this goal focus on?
                      </p>
                      
                      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                        {categories.map((category) => {
                          const CategoryIcon = category.icon;
                          return (
                            <button
                              key={category.id}
                              onClick={() => setSelectedCategory(category.id)}
                              className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                                selectedCategory === category.id
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 ${category.bgClass} rounded-lg flex items-center justify-center`}>
                                  <CategoryIcon className={`w-4 h-4 ${category.textClass}`} />
                                </div>
                                <span className="text-gray-900 text-sm">{category.name}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-gray-900 mb-2">Describe your goal</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        What do you want to achieve? Include any challenging parts.
                      </p>
                      
                      {selectedCategoryData && (
                        <div className="mb-4">
                          <Badge 
                            className={`${selectedCategoryData.bgClass} ${selectedCategoryData.textClass} border-0`}
                          >
                            {selectedCategoryData.name} • {timeframe === 'short' ? 'Short-term' : 'Long-term'}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Goal Title</Label>
                          <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Daily meditation practice"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Description & Challenges</Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what you want to achieve and what might be challenging about it..."
                            className="mt-1 min-h-[100px]"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between gap-3">
                {step > 1 ? (
                  <Button
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
                
                {step < 3 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    disabled={
                      (step === 1 && !canProceedToStep2) ||
                      (step === 2 && !canProceedToStep3)
                    }
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={!canSave || isGeneratingPlan}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                  >
                    {isGeneratingPlan ? (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin" />
                        Creating Plan...
                      </div>
                    ) : (
                      'Create Goal'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}