'use client'

import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl';

import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/src/components/ui/form'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Button } from '@/src/components/ui/button'
import * as RadixSwitch from '@radix-ui/react-switch'

import z from 'zod'



export const getFormSchema = (t: ReturnType<typeof useTranslations>) => 
    z.object({
        description: z.string().min(3, t('description_min_3')),
        hours: z.string().regex(/^\d+$/, t('hours_number')),
        minutes: z.string().regex(/^[0-5]?\d$/, t('minutes_range')),
        seconds: z.string().regex(/^[0-5]?\d$/, t('seconds_range')),
        bid: z.string().regex(/^\d+(\.\d+)?$/, t('bid_number')),
        maxPlayers: z.coerce.number().min(2, t('max_players_min')),
        isGroup: z.boolean(),
        groupAddresses: z
            .array(
                z.object({
                    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, t('address_format')),  // or `.regex(/^0x[a-fA-F0-9]{40}$/)`
                })
            )
    }).transform(({ hours, minutes, seconds, maxPlayers, bid, description, isGroup, groupAddresses}) => ({
        duration: Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds),
        maxPlayers,
        bid,
        description,
        isGroup,
        groupAddresses,
    })).superRefine((data, ctx) => {
        if (data.duration < 30) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('total_duration_error'),
                path: ['total duration'],
            })
        }
        if (data.isGroup && data.groupAddresses.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('at_least_two_addresses'),
                path: [`isGroup`],
            })
        }
        // Uniqueness check for groupAddresses
        const seen = new Set<string>();
        data.groupAddresses.forEach((item, index) => {
            if (seen.has(item.address)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: t('duplicate_address'),
                    path: ["isGroup"],
                });
            } else {
                seen.add(item.address);
            }
        });
    });

export type ChallengeFormValues = z.input<ReturnType<typeof getFormSchema>> | any | z.output<ReturnType<typeof getFormSchema>>;


const ChallengeForm = ({
    onSubmit,
}: {
    onSubmit: (values: ChallengeFormValues) => void
}) => {
    const t = useTranslations('ChallengeForm');
    const formSchema = getFormSchema(t);
    const form = useForm<ChallengeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            hours: '0',
            minutes: '1',
            seconds: '0',
            maxPlayers: 5,
            bid: '',
            description: '',
            isGroup: true,
            groupAddresses: [],
        },
    })
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'groupAddresses',
    });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="
                    relative space-y-8 w-full max-w-[1000px] p-10 
                    bg-gradient-to-br from-[#1A1F33] to-[#151A2A] 
                    border-1 border-white/20 
                    rounded-2xl shadow-2xl
                    before:absolute before:inset-0
                    before:rounded-2xl
                    before:bg-gradient-to-r before:from-cyan-500 before:to-purple-500
                    before:opacity-50 before:-z-10
                "
            >
                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem className="space-y-2">
                            <FormLabel>{t('description_label')}</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder={t('description_placeholder')} 
                                        {...field} 
                                        className="
                                            w-full bg-[#0A0F1E] border border-white/20 rounded-lg
                                            px-4 py-3 text-white placeholder:text-white/50
                                            focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400
                                            transition duration-200 selection:bg-[#324b96]
                                        "
                                    />
                                </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Duration */}
                <FormField
                    control={form.control}
                    name="total duration"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('duration_label')}</FormLabel>
                            <div className='flex gap-2 items-end'>
                                {['hours', 'minutes', 'seconds'].map((name, i) => (
                                    <FormField
                                        key={name}
                                        control={form.control}
                                        name={name as 'hours' | 'minutes' | 'seconds'}
                                        render={({ field }) => (
                                        <FormItem className="w-30 flex">
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    min={0} 
                                                    max={name !== 'hours' ? 59 : undefined} 
                                                    {...field} 
                                                    className="
                                                        w-24 bg-[#0A0F1E] border border-white/20 rounded-md
                                                        px-3 py-2 text-white placeholder:text-white/50
                                                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                                                        transition duration-200
                                                    "
                                                />
                                            </FormControl>
                                            {/* <FormLabel className="text-xs">{name.charAt(0).toUpperCase() + name.slice(1)}</FormLabel> */}
                                            <FormLabel className="text-xs">{t(name)}</FormLabel>
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

                <FormField
                    control={form.control}
                    name="bid"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-medium">{t('bid_label')}</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="0.1"
                                        min={0}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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
                                        {...field} 
                                        className="
                                            w-full bg-[#0A0F1E] border border-white/20 rounded-lg
                                            px-4 py-2 text-white placeholder:text-white/50
                                            focus:border-purple-500 focus:ring-2 focus:ring-purple-500
                                            transition duration-200 selection:bg-[#324b96]
                                        "/>
                                </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Mode switch */}
                <FormField
                    control={form.control}
                    name="isGroup"
                    render={({ field }) => (
                        <FormItem className="flex items-center space-x-3">
                            <FormControl>
                                <RadixSwitch.Root
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="
                                    relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full
                                    data-[state=unchecked]:bg-gradient-to-r data-[state=unchecked]:from-cyan-400 data-[state=unchecked]:to-purple-600 
                                    data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-400 data-[state=checked]:to-purple-600
                                    transition-colors duration-200 ease-in-out
                                    focus:outline-none focus:ring-2 focus:ring-cyan-400
                                "
                                >
                                <RadixSwitch.Thumb
                                    className="
                                        pointer-events-none block h-5 w-5 transform rounded-full bg-white shadow
                                        transition-transform duration-200 ease-in-out
                                        data-[state=checked]:translate-x-5
                                    "
                                />
                                </RadixSwitch.Root>
                            </FormControl>
                            <FormLabel>{t('mode_label')}</FormLabel>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Conditional: Max players or group addresses */}
                {!form.watch('isGroup') ? (
                    <FormField
                        control={form.control}
                        name="maxPlayers"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('public_max_players_label')}</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        {...field}
                                        className="
                                            w-full bg-[#0A0F1E] border border-white/20 rounded-lg
                                            px-4 py-2 text-white placeholder:text-white/50
                                            focus:border-green-500 focus:ring-2 focus:ring-green-500
                                            transition duration-200
                                        "
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : (
                    <FormItem>
                        <FormLabel>{t('group_addresses_label')}</FormLabel>
                        {fields.map((item, index) => (
                            <FormField
                                key={item.id}
                                control={form.control}
                                name={`groupAddresses.${index}.address` as const}
                                render={({ field }) => (
                                    <FormItem className="mb-2">
                                        <div className='flex items-center space-x-2'>
                                            <FormControl>
                                                <Input
                                                    placeholder="0x..."
                                                    {...field}
                                                    className="
                                                        w-full bg-[#0A0F1E] border border-white/20 rounded-lg
                                                        px-4 py-2 text-white placeholder:text-white/50
                                                        focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500
                                                        transition duration-200 selection:bg-[#324b96]
                                                    "
                                                />
                                            </FormControl>
                                            <Button 
                                                type="button" 
                                                variant="destructive" 
                                                onClick={() => remove(index)}
                                                className="px-3 py-1 bg-red-600 hover:bg-red-700 transition rounded-md text-white"
                                            >
                                                {t('remove_address')}
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                        <div>
                            <Button 
                                type="button" 
                                className="
                                    bg-gradient-to-r from-green-500 to-cyan-500
                                    text-white px-4 py-2 rounded-lg shadow hover:brightness-110
                                    transition duration-200
                                "
                                onClick={() => append({ address: '' })}
                            >
                                {t('add_address')}
                            </Button>
                        </div>
                    </FormItem>
                )}

                {/* Submit Button */}
                <Button
                    type="submit" 
                    className="
                        w-full px-6 py-3
                        bg-gradient-to-r from-purple-500 to-blue-500
                        text-white font-semibold rounded-2xl shadow-2xl
                        hover:scale-105 hover:brightness-110
                        transition-transform duration-200
                    "
                >
                    {t('submit_button')}
                </Button>
            </form>
        </Form>

    )
}

export default ChallengeForm