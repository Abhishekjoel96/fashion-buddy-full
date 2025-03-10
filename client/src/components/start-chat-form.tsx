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
        description: "To receive messages, please join our WhatsApp sandbox by sending 'join plenty-entirely' to +14155238886",
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
            <li>Send "join plenty-entirely" to +14155238886 on WhatsApp</li>
            <li>Wait for confirmation message from Twilio</li>
            <li>Then click the button below to start your fashion consultation</li>
          </ol>
        </div>
        <Button type="submit">Start WhatsApp Chat</Button>
      </form>
    </Form>
  );
}