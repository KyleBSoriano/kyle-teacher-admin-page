import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import HelpTooltip from "@/components/ui/HelpTooltip";

const HelpPage = () => {
  const [supportMessage, setSupportMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const handleSendMessage = () => {
    if (!supportMessage.trim() || !userEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both your name and message.",
        variant: "destructive",
      });
      return;
    }

    // Simulate sending message
    toast({
      title: "Message Sent",
      description: "Your inquiry has been submitted. We'll get back to you soon!",
    });
    setSupportMessage("");
    setUserEmail("");
  };

  const faqs = [
    {
      question: "How do I create a new class session?",
      answer: "Navigate to Classes and click '+ Add Class'. Fill in the class details including period, subject, and time. Your class will be created with a unique code that students can use to join."
    },
    {
      question: "How do I manage app permissions for my class?",
      answer: "On the Classes page, select your class and use the app templates to control which apps students can access. You can activate different templates or create custom ones with the specific apps you want to allow."
    },
    {
      question: "Can I see which students are CLocked in?",
      answer: "Yes! The attendance count updates in real-time as students scan the QR code. You can also view detailed attendance records for each class session."
    },
    {
      question: "What if I need to change allowed apps mid-class?",
      answer: "Simply select a different template or edit your current template on the Classes page. Changes take effect immediately for all students in that class."
    },
    {
      question: "How do students join my class?",
      answer: "Students can scan the QR code displayed on your screen or use the class code shown at the top of your class card. Both methods will CLock them in and apply your app restrictions."
    },
    {
      question: "Can I create custom app templates?",
      answer: "Yes! Click 'Edit' on any template to customize which apps are available, or create a new template from scratch with your preferred app selection."
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#012D68] mb-1">Help & Support</h1>
        <p className="text-gray-600 text-base">
          Find answers to common questions and get support for using the attendance system.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        {/* Contact Support Card - Full Width */}
        <Card className="border-0 shadow-lg">
          <div className="bg-[#012D68] rounded-t-lg p-4">
            <div className="flex items-center mb-1">
              <CardTitle className="text-xl font-bold text-white">Contact Support</CardTitle>
              <HelpTooltip content="Send a message to get help with any issues or questions" />
            </div>
            <p className="text-gray-200 text-sm">How can we help? Send us a message and we'll get back to you.</p>
          </div>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="border-gray-200 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe your issue or question..."
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                rows={4}
                className="border-gray-200 rounded-md"
              />
            </div>
            <Button 
              onClick={handleSendMessage}
              variant="outline"
              className="w-full bg-white border border-[#012D68] text-[#012D68] hover:bg-gray-50 hover:border-[#012D68] text-lg font-semibold shadow-lg transition-all duration-200"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Other ways to reach us:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-[#012D68]" />
                  <span>admin@clockedmobile.com</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="border-0 shadow-lg">
        <div className="bg-[#012D68] rounded-t-lg p-4">
          <div className="flex items-center mb-1">
            <CardTitle className="text-xl font-bold text-white">Frequently Asked Questions</CardTitle>
            <HelpTooltip content="Common questions and answers about using the system" />
          </div>
          <p className="text-gray-200 text-sm">Common questions and answers about using the attendance system.</p>
        </div>
        <CardContent className="p-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;