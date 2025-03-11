import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, {
    message: "Please enter a valid phone number with country code (e.g., +1234567890)",
  }),
});

export default function StartChatForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Ensure phone number has country code
      const phoneNumber = values.phoneNumber.startsWith('+') 
        ? values.phoneNumber 
        : `+${values.phoneNumber}`;

      await apiRequest("POST", "/api/start-chat", { 
        ...values, 
        phoneNumber 
      });

      toast({
        title: "Success!",
        description: "Please check your WhatsApp for instructions on joining our sandbox environment. You'll need to send a join code to Twilio's WhatsApp number +14155238886",
      });
      form.reset();
    } catch (error) {
      console.error("Start chat error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start chat. Please try again.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-sm text-muted-foreground mb-4">
          <p>Important: Before starting the chat:</p>
          <ol className="list-decimal pl-4 mt-2">
            <li>First, you'll receive instructions via WhatsApp to join our sandbox</li>
            <li>Send the provided join code to Twilio's WhatsApp number (+14155238886)</li>
            <li>Wait for confirmation from Twilio</li>
            <li>Then your fashion consultation will begin automatically</li>
            <li>When asked for a selfie, take a photo directly with your camera (don't send stickers or saved images)</li>
          </ol>
        </div>
        <Button type="submit">Start WhatsApp Chat</Button>
      </form>
    </Form>
  );
}