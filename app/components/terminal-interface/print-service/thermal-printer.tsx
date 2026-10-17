
import { Printer } from 'lucide-react';
import React, { useState } from 'react';
import { boolean } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Button } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';

type WritableCharacteristic = {
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValue: (value: BufferSource) => Promise<void>;
};

type ComponentProps = {
  mode: "print_qr" | "print_order" | "setup_printer"
  qr_object?: string
  text: string
  isDisabled: boolean
}

export default function ButtonPrint({ mode, qr_object, text, isDisabled } : ComponentProps) {
  const [device, setDevice] = useState(null);
  const [characteristic, setCharacteristic] = useState<WritableCharacteristic | null>(null);
  const [status, setStatus] = useState('Disconnected');
  const [loading, setLoading] = useState(false);

  const connectPrinter = async () => {
    try {
      setStatus('Searching for printer...');
      

      const selectedDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '0000e701-0000-1000-8000-00805f9b34fb'
        ]
      });

      setStatus('Connecting to GATT Server...');
      const server = await selectedDevice.gatt.connect();

      const services = await server.getPrimaryServices();
      let targetCharacteristic: WritableCharacteristic | null = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            targetCharacteristic = char;
            break;
          }
        }
        if (targetCharacteristic) break;
      }

      if (!targetCharacteristic) {
        throw new Error('No writable characteristic found on this printer.');
      }

      setDevice(selectedDevice);
      setCharacteristic(targetCharacteristic);
      setStatus(`Connected to ${selectedDevice.name || 'Thermal Printer'}`);
    } catch (error) {
      console.error('Bluetooth Connection Error:', error);
      setStatus(`Connection Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const writeInChunks = async (characteristic: WritableCharacteristic, data: Uint8Array, chunkSize = 100) => {
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.subarray(i, i + chunkSize);
        const writableChunk = new Uint8Array(chunk.length);
        writableChunk.set(chunk);
        await characteristic.writeValue(writableChunk);
    }
  };

  const handleQrPrint = async (qr_data_string: string) => {
      if (!characteristic) {
          alert('Connect the printer first!');
          return;
      }

      try {
          setLoading(true);
          setStatus('Printing QR Code...');

          const encoder = new TextEncoder();

          // 1. ESC/POS Formatting Commands
          const ESC_INIT = new Uint8Array([0x1b, 0x40]); // Initialize Printer
          const ALIGN_CENTER = new Uint8Array([0x1b, 0x61, 0x01]); // Align Center
          const ALIGN_LEFT = new Uint8Array([0x1b, 0x61, 0x00]); // Align Left
          const TEXT_BOLD_ON = new Uint8Array([0x1b, 0x45, 0x01]); // Bold On
          const TEXT_BOLD_OFF = new Uint8Array([0x1b, 0x45, 0x00]); // Bold Off
          const PAPER_FEED = new Uint8Array([0x1b, 0x64, 0x04]); // Feed 4 lines

          const title = encoder.encode('SEAREN SIZZLE POS\n');
          const divider = encoder.encode('--------------------------------\n');
          const subtitle = encoder.encode('SCAN TO PAY VIA QRPH\n\n');
          const footer = encoder.encode('\nThank you for dining with us!\n');

          // 2. ESC/POS Native QR Code Generation Commands
          const qrBytes = encoder.encode(qr_data_string);
          const qrLength = qrBytes.length + 3;
          const pL = qrLength % 256;
          const pH = Math.floor(qrLength / 256);

          // Set QR Model 2
          const QR_MODEL = new Uint8Array([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);
          // Set QR Size (0x06 = Medium/Large, i-adjust mula 0x03 hanggang 0x08 depende sa lapad ng papel)
          const QR_SIZE = new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]);
          // Set Error Correction Level M (0x31)
          const QR_EC_LEVEL = new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]);
          // Store QR Data
          const QR_STORE_HEADER = new Uint8Array([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]);
          // Print Stored QR Code
          const QR_PRINT = new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]);

          // Pagdugtong-dugtungin ang mga command bytes
          const payload = combineUint8Arrays([
          ESC_INIT,
          ALIGN_CENTER,
          TEXT_BOLD_ON,
          title,
          TEXT_BOLD_OFF,
          divider,
          subtitle,
          // Print Native QR Code
          QR_MODEL,
          QR_SIZE,
          QR_EC_LEVEL,
          QR_STORE_HEADER,
          qrBytes,
          QR_PRINT,
          // Footer & Feed
          divider,
          footer,
          PAPER_FEED
          ]);

          await writeInChunks(characteristic, payload);

          setStatus('Print Success!');
      } catch (error) {
          console.error('Print Error:', error);
          setStatus(`Print Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
          setLoading(false);
      }
  };


  const combineUint8Arrays = (arrays: Uint8Array[]) => {
    const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  };

  if(!device && false){
      return <>
        <Button onClick={connectPrinter} className="bg-green-900 text-white hover:bg-green-700">
            Connect Bluetooth Printer
        </Button>
      </>
  }

  if(mode == "print_qr"){
    return <>
      <div>
        {!device ? (
          <Button onClick={connectPrinter} className="bg-red-700 text-white">
            {loading && <Spinner />} Connect Printer
          </Button>
        ) : (
          <Button onClick={() => handleQrPrint(qr_object)} disabled={loading || isDisabled} className="bg-green-900 text-white hover:bg-green-700">
            {loading && <Spinner />} <Printer /> {text}
          </Button>
        )}
      </div>
    </>
    
  }

  return (
    <>You misconfigured this component if you saw this.</>
  );
}