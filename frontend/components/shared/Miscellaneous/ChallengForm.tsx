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

import z from 'zod'


export const formSchema = z.object({
    hours: z.string().regex(/^\d+$/, 'Must be a number'),
    minutes: z.string().regex(/^[0-5]?\d$/, '0–59'),
    seconds: z.string().regex(/^[0-5]?\d$/, '0–59'),
    maxPlayers: z.coerce.number().min(1),
    bid: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a valid number'),
    description: z.string().min(3),
}).transform(({ hours, minutes, seconds, maxPlayers, bid, description }) => ({
    duration: Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds),
    maxPlayers,
    bid,
    description,
}))
.superRefine((data, ctx) => {
    if (data.duration < 30) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Total duration must be at least 30 seconds',
            path: ['total duration'], // attach error here
        })
    }
})

export type ChallengeFormValues = z.input<typeof formSchema> | any | z.output<typeof formSchema>; 


const ChallengeForm = ({
    onSubmit,
}: {
    onSubmit: (values: ChallengeFormValues) => void
}) => {
    const form = useForm<ChallengeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            hours: '0',
            minutes: '1',
            seconds: '0',
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
                    name="total duration" // tie error to seconds
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <div className='flex gap-2 items-end'>
                                {['hours', 'minutes', 'seconds'].map((name, i) => (
                                    <FormField
                                        key={name}
                                        control={form.control}
                                        name={name as 'hours' | 'minutes' | 'seconds'}
                                        render={({ field }) => (
                                        <FormItem className="w-30 flex">
                                            <FormControl>
                                                <Input type="number" min={0} max={name !== 'hours' ? 59 : undefined} {...field} />
                                            </FormControl>
                                            <FormLabel className="text-xs">{name.charAt(0).toUpperCase() + name.slice(1)}</FormLabel>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                ))}
                            </div>
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