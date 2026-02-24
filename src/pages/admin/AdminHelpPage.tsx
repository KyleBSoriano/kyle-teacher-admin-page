import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, MessageCircle, Mail, Send, Users, QrCode, Smartphone, Settings, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import HelpTooltip from "@/components/ui/HelpTooltip";

const AdminHelpPage = () => {
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
      question: "How do I manage the school-wide bell schedule?",
      answer: "Navigate to the Schedule page from the admin dashboard. You can create time blocks for different periods, set up different schedules for different days, and save presets for easy reuse throughout the year."
    },
    {
      question: "How can I view individual student profiles and accommodations?",
      answer: "Use the search bar on the Admin Dashboard to find specific students. Click 'View Profile' to see their details, CLocked status, and manage custom permissions for students with IEPs or special accommodations."
    },
    {
      question: "What does the CLock Out All button do?",
      answer: "This button instantly CLocks out all students who are currently CLocked in across the entire school. It's useful for ending sessions at the end of the school day or during emergencies."
    },
    {
      question: "How do I set the default app template for the school?",
      answer: "Go to the Apps page in the admin dashboard. The 'Default App Template' section lets you configure which apps are available during passing periods and as the baseline for all classes unless teachers customize their settings."
    },
    {
      question: "Can I restrict which apps teachers can enable?",
      answer: "Yes! The 'Allowed Apps on Campus' section on the Apps page controls the approved set of apps that teachers can choose from. This ensures school-wide compliance with your technology policies."
    },
    {
      question: "How do I export school-wide attendance reports?",
      answer: "Navigate to the Students page where you can view comprehensive attendance data across all classes and periods. You can filter by date range and export reports for administrative records."
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#012D68] mb-1">Help & Support</h1>
        <p className="text-gray-600 text-base">
          Find answers to common questions and get support for using the admin dashboard.
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
            <HelpTooltip content="Common questions and answers about admin features" />
          </div>
          <p className="text-gray-200 text-sm">Common questions and answers about the admin dashboard.</p>
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

export default AdminHelpPage;
