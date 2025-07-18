"use client";

import React, { useState, useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Pill, Search, Stethoscope, Syringe, Weight, FileText } from "lucide-react";

import { drugSearch } from "@/ai/flows/drug-search";
import { offlineDosageCalculation } from "@/ai/flows/offline-dosage-calculation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { estimateWeight } from "@/lib/who-weight-chart";
import * as Calcs from "@/lib/calculations";
import type { DrugInfo, CalculationResult } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  query: z.string().min(2, "Please enter a drug or condition."),
  weight: z.string().optional(),
  age: z.string().optional(),
  formType: z.enum(["syrup", "tablet"]),
  strengthMg: z.string(),
  strengthMl: z.string().optional(),
}).refine(data => data.weight || data.age, {
  message: "Either Weight or Age must be provided.",
  path: ["weight"],
});

type FormValues = z.infer<typeof formSchema>;

const categoryIcons: { [key: string]: React.ElementType } = {
    Antibiotic: Stethoscope,
    Antipyretic: Syringe,
    Respiratory: FileText,
    GI: FileText,
    default: Pill,
};

export function DosageCalculator() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [drugInfo, setDrugInfo] = useState<DrugInfo | null>(null);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
      weight: "",
      age: "",
      formType: "syrup",
      strengthMg: "",
      strengthMl: "5",
    },
  });

  const { watch, getValues } = form;
  const formType = watch("formType");
  const weight = watch('weight');
  const age = watch('age');
  const strengthMg = watch('strengthMg');
  const strengthMl = watch('strengthMl');

  const { dosePerKg, maxDailyDosePerKg, frequency } = drugInfo || {};

  useEffect(() => {
    const values = getValues();
    const weightKg = parseFloat(values.weight || "0") || (values.age ? estimateWeight(parseFloat(values.age) || 0) : 0);
    const numStrengthMg = parseFloat(values.strengthMg);

    if (!weightKg || !numStrengthMg || !dosePerKg || !drugInfo) {
      setCalculation(null);
      return;
    }

    const dosesPerDay = Calcs.getDosesPerDay(drugInfo.frequency || '');
    const totalDailyDoseMg = Calcs.calculateDoseMg(weightKg, dosePerKg);
    const singleDoseMg = totalDailyDoseMg / dosesPerDay;

    const newCalculation: CalculationResult = {
      doseMg: singleDoseMg,
      totalDailyDose: totalDailyDoseMg,
      dosesPerDay: dosesPerDay,
    };
    
    if (maxDailyDosePerKg) {
      const maxDailyDoseMg = Calcs.calculateMaxDailyDose(weightKg, maxDailyDosePerKg);
      newCalculation.maxDailyDose = maxDailyDoseMg;
      if (totalDailyDoseMg > maxDailyDoseMg) {
        newCalculation.warning = `Total daily dose (${totalDailyDoseMg.toFixed(2)}mg) exceeds the maximum recommended daily dose (${maxDailyDoseMg.toFixed(2)}mg).`;
      }
    }

    if (values.formType === "syrup") {
      const numStrengthMl = parseFloat(values.strengthMl || '0');
      if (numStrengthMl > 0) {
        newCalculation.doseMl = Calcs.calculateVolumeMl(singleDoseMg, numStrengthMg, numStrengthMl);
      }
    } else {
        newCalculation.doseTablets = Calcs.calculateTablets(singleDoseMg, numStrengthMg);
    }

    setCalculation(newCalculation);

  }, [strengthMg, strengthMl, formType, dosePerKg, maxDailyDosePerKg, frequency, getValues, drugInfo, weight, age]);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setDrugInfo(null);
    setCalculation(null);

    const weightNum = parseFloat(values.weight || '0');
    const ageNum = parseFloat(values.age || '0');
    const finalWeight = weightNum > 0 ? weightNum : estimateWeight(ageNum);

    if (finalWeight <= 0) {
        toast({
            variant: "destructive",
            title: "Invalid Input",
            description: "Please provide a valid weight or age.",
        });
        setIsLoading(false);
        return;
    }
    
    // Update form with estimated weight if age was used
    if (!weightNum && ageNum > 0) {
      form.setValue('weight', finalWeight.toFixed(1));
    }

    try {
      let result;
      if (isOnline) {
        result = await drugSearch({
          query: values.query,
          weightKg: finalWeight,
          ageYears: ageNum > 0 ? ageNum : undefined,
        });
      } else {
        result = await offlineDosageCalculation({
          searchTerm: values.query,
          weightKg: finalWeight,
          ageYears: ageNum > 0 ? ageNum : undefined,
          form: values.formType,
          strengthMg: parseFloat(values.strengthMg) || undefined,
          volumeMl: parseFloat(values.strengthMl || '0') || undefined,
        });
        toast({ title: "Offline Mode", description: "Using local data for calculations." });
      }

      if (result) {
        setDrugInfo(result);
        if (result.dosePerKg && result.strength) {
          const strengthParts = result.strength.match(/(\d+(\.\d+)?)\s*mg(?:\/(\d+(\.\d+)?)\s*mL)?/i);
          if (strengthParts) {
            form.setValue('strengthMg', strengthParts[1]);
            if (strengthParts[3]) {
              form.setValue('strengthMl', strengthParts[3]);
              form.setValue('formType', 'syrup');
            } else {
              form.setValue('formType', 'tablet');
            }
          }
        }
      } else {
        throw new Error("Drug not found");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: (error as Error).message || "Could not find the specified drug. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const renderCategoryIcon = (category?: string) => {
    const Icon = category && categoryIcons[category] ? categoryIcons[category] : categoryIcons.default;
    return <Icon className="h-5 w-5 mr-2 text-primary" />;
  };

  const formatTablets = (numTablets: number): string => {
    if (numTablets == null || isNaN(numTablets) || numTablets < 0) return '';
    
    // Handle very small numbers
    if (numTablets < 0.001) return '0';
    
    const whole = Math.floor(numTablets);
    const fraction = numTablets - whole;

    if (Math.abs(fraction) < 0.125) {
        return whole === 0 ? '0' : `${whole}`;
    }
    if (Math.abs(fraction - 0.25) < 0.125) {
        return whole > 0 ? `${whole} (1/4)` : '1/4';
    }
    if (Math.abs(fraction - 0.5) < 0.125) {
      return whole > 0 ? `${whole} (1/2)` : '1/2';
    }
    if (Math.abs(fraction - 0.75) < 0.125) {
        return whole > 0 ? `${whole} (3/4)` : '3/4';
    }
    if (fraction > 0.875) {
        return `${whole + 1}`;
    }
    return numTablets.toFixed(2);
  };


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">Pediatric Dose Finder</CardTitle>
        <CardDescription>Drug dosage calculator for children.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drug or Condition</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder='e.g., "fever", "azithro 250"' {...field} />
                      </FormControl>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span className="sr-only">Search</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 12.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age (years) (optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 2 (used if no weight)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {drugInfo && (
              <Card className="bg-secondary/50">
                <CardHeader className="pb-4">
                    <div className="flex items-center">
                        {renderCategoryIcon(drugInfo.category)}
                        <CardTitle className="text-lg">{drugInfo.name || 'Drug Information'}</CardTitle>
                        {drugInfo.category && <Badge variant="outline" className="ml-auto">{drugInfo.category}</Badge>}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {drugInfo.dosePerKg && <p><strong>Standard Daily Dose:</strong> {drugInfo.dosePerKg} mg/kg/day</p>}
                    {drugInfo.frequency && <p><strong>Frequency:</strong> {drugInfo.frequency}</p>}
                  </div>
                  <FormField
                    control={form.control}
                    name="formType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Formulation</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <RadioGroupItem value="syrup" id="formType-syrup" />
                              <Label htmlFor="formType-syrup" className="font-normal">Syrup</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <RadioGroupItem value="tablet" id="formType-tablet" />
                              <Label htmlFor="formType-tablet" className="font-normal">Tablet</Label>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="strengthMg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strength (mg)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 125" {...field} />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    {formType === "syrup" && (
                      <FormField
                        control={form.control}
                        name="strengthMl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>per Volume (mL)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {calculation && (
              <Alert variant="default" className="bg-primary/5 border-primary/20">
                <div className="flex items-center mb-2">
                    {formType === 'syrup' ? 
                        <Syringe className="h-6 w-6 text-primary" /> : 
                        <Pill className="h-6 w-6 text-primary" />}
                    <AlertTitle className="ml-2 text-xl font-bold text-primary">Calculated Dose</AlertTitle>
                </div>
                <AlertDescription className="text-lg text-foreground/90 space-y-2">
                  {calculation.doseMl != null && (
                    <p className="font-semibold">
                      <span className="text-3xl font-bold text-accent">{calculation.doseMl.toFixed(1)}</span> mL per dose
                    </p>
                  )}
                  {calculation.doseTablets != null && (
                    <p className="font-semibold">
                      <span className="text-3xl font-bold text-accent">{formatTablets(calculation.doseTablets)}</span>{' '}
                      {Math.abs(calculation.doseTablets - 1) < 0.001 ? 'tablet' : 'tablets'} per dose
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    ({calculation.doseMg.toFixed(2)} mg/dose)
                  </p>
                  
                  <div className="pt-2 text-sm text-muted-foreground border-t border-border mt-2 space-y-1">
                    {drugInfo?.frequency && <p><strong>Frequency:</strong> {drugInfo.frequency}</p>}
                    <p><strong>Total Daily Dose:</strong> {calculation.totalDailyDose.toFixed(2)} mg</p>
                    {calculation.maxDailyDose && 
                      <p><strong>Max Daily Dose:</strong> {calculation.maxDailyDose.toFixed(2)} mg</p>
                    }
                  </div>
                  
                  {calculation.warning && (
                     <p className="text-sm font-medium text-destructive pt-2">{calculation.warning}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
