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
        title: "Important: Connect to WhatsApp Sandbox First",
        description: `
          1. Find your Twilio number (+14155238886)
          2. Send "join your-sandbox-keyword" to this number (get the exact keyword from your Twilio Console)
          3. Wait for confirmation before proceeding
          4. Once connected, you can start your fashion consultation!
        `,
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
          <p className="font-semibold text-base mb-2">Important: WhatsApp Sandbox Setup</p>
          <ol className="list-decimal pl-4 space-y-2">
            <li>After submitting, you'll need to join Twilio's WhatsApp sandbox</li>
            <li>Send <span className="font-mono bg-muted px-1 rounded">join your-sandbox-keyword</span> to <span className="font-mono bg-muted px-1 rounded">+14155238886</span></li>
            <li>Get the exact sandbox keyword from your Twilio Console > WhatsApp Sandbox Settings</li>
            <li>Wait for confirmation before starting your chat</li>
            <li>For testing, only use your camera for selfies (no saved images or stickers)</li>
          </ol>
        </div>
        <Button type="submit">Start WhatsApp Chat</Button>
      </form>
    </Form>
  );
}