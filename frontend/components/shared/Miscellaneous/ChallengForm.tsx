'use client'

import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'           // :contentReference[oaicite:3]{index=3}
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

import { ChallengeFormValues, formSchema } from '../ChallengeFactory'



const ChallengeForm = ({
  onSubmit,
}: {
  onSubmit: (values: ChallengeFormValues) => void
}) => {
    const form = useForm<ChallengeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            duration: 60,
            maxPlayers: 5,
            bid: '',
            description: '',
        },
    })

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 w-full max-w-[1000px] p-6 bg-white rounded-lg shadow"
            >
                {/* Duration */}
                <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Duration (seconds)</FormLabel>
                                <FormControl>
                                    <Input type="number" min={1} {...field} />
                                </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Max Players */}
                <FormField
                    control={form.control}
                    name="maxPlayers"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Max Players Allowed</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Bid */}
                <FormField
                    control={form.control}
                    name="bid"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Bid Amount (DARE)</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="0.1" 
                                        min={0} 
                                        onKeyDown={(e) => {
                                            const allowedKeys = [
                                                'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', '.', // allow decimal point
                                            ];
                                            if (
                                                !allowedKeys.includes(e.key) &&
                                                !/^\d$/.test(e.key) // only digits
                                            ) {
                                                e.preventDefault();
                                            }
                                        }}
                                        {...field} />
                                </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="A short description..." {...field} />
                                </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Submit Button */}
                <Button type="submit" className="w-full">
                    Create Challenge
                </Button>
            </form>
        </Form>
    )
}

export default ChallengeForm