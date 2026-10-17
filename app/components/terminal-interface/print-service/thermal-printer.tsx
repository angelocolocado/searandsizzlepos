import { Printer } from 'lucide-react';
import React, { useState } from 'react';
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
  mode: "print_qr" | "print_order" | "setup_printer";
  qr_object: string;
  text: string;
  isDisabled: boolean;
};

const writeInChunks = async (characteristic: WritableCharacteristic, data: Uint8Array, chunkSize = 100) => {
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.subarray(i, i + chunkSize);
      const writableChunk = new Uint8Array(chunk.length);
      writableChunk.set(chunk);
      await characteristic.writeValue(writableChunk);
      
      // Mabilis na pahinga (25ms) para makahinga ang Bluetooth buffer ng Deli S423
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  };

export default function ButtonPrint({ mode, qr_object, text, isDisabled }: ComponentProps) {
  const [device, setDevice] = useState<any>(null);
  const [characteristic, setCharacteristic] = useState<WritableCharacteristic | null>(null);
  const [status, setStatus] = useState('Disconnected');
  const [loading, setLoading] = useState(false);

  const TEXT_SIZE_DOUBLE = new Uint8Array([0x1d, 0x21, 0x11]); // 2x Width & 2x Height (Pinaka-bagay sa Title)
  const TEXT_SIZE_NORMAL = new Uint8Array([0x1d, 0x21, 0x00]); // Reset pabalik sa normal size
  const ESC_INIT = new Uint8Array([0x1b, 0x40]); // Reset & Initialize Printer
  const ALIGN_CENTER = new Uint8Array([0x1b, 0x61, 0x01]); // Align Center
  const TEXT_BOLD_ON = new Uint8Array([0x1b, 0x45, 0x01]); // Bold On
  const TEXT_BOLD_OFF = new Uint8Array([0x1b, 0x45, 0x00]); // Bold Off
  const PAPER_FEED = new Uint8Array([0x1b, 0x64, 0x04]); // Feed 4 lines


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

  const createQrRaster = async (qrImageUrl: string): Promise<Uint8Array> => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = qrImageUrl;
    await image.decode();

    const TARGET_QR_SIZE = 220; // Perfect size sa 58mm receipt paper
    const scale = Math.min(TARGET_QR_SIZE / image.naturalWidth, TARGET_QR_SIZE / image.naturalHeight);
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);

    if (width === 0 || height === 0) {
      throw new Error('The QR image has invalid dimensions.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to prepare the QR image for printing.');
    }

    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, width, height);

    const pixels = context.getImageData(0, 0, width, height).data;
    const bytesPerRow = Math.ceil(width / 8);
    const raster = new Uint8Array(bytesPerRow * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = (y * width + x) * 4;
        const luminance = (pixels[pixel] * 299 + pixels[pixel + 1] * 587 + pixels[pixel + 2] * 114) / 1000;
        if (luminance < 128) {
          raster[y * bytesPerRow + Math.floor(x / 8)] |= 0x80 >> (x % 8);
        }
      }
    }

    const xL = bytesPerRow & 0xff;
    const xH = bytesPerRow >> 8;
    const yL = height & 0xff;
    const yH = height >> 8;

    return combineUint8Arrays([
      new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]),
      raster,
    ]);
  };

  const handleQrPrint = async (qrImageUrl: string) => {
    if (!characteristic) {
      alert('Connect the printer first!');
      return;
    }

    const qrRaster = await createQrRaster(qrImageUrl);

    try {
      setLoading(true);
      setStatus('Printing QR Code...');

      const encoder = new TextEncoder();


      const title = encoder.encode(
        'SEAR & SIZZLE\n'
      );

      const website = encoder.encode(
        'searensizzle.com\n'
      );

      const divider = encoder.encode(
        '--------------------------------\n'
      );

      const subtitle = encoder.encode(
        'CASHLESS PAYMENT\n' +
        'SCAN & PAY WITH QR PH\n\n'
      );

      const instructions = encoder.encode(
        'Payment pending or failed?\n' +
        'Please ask our cashier for help\n' +
        'before trying again.\n'
      );

      const footer = encoder.encode(
        '\n' +
        '********************************\n' +
        'Thank you for dining with us!\n' +
        'We hope to see you again soon!\n' +
        'Have a sizzling day!\n\n'
      );

      const ALIGN_LEFT = new Uint8Array([
        0x1b, 0x61, 0x00
      ]);

      const payload = combineUint8Arrays([
        TEXT_SIZE_DOUBLE,
        ESC_INIT,
        ALIGN_CENTER,
        TEXT_BOLD_ON,
        title,
        TEXT_BOLD_OFF,
        TEXT_SIZE_NORMAL,
        website,
        divider,
        subtitle,
        qrRaster,
        encoder.encode('\n'),
        divider,
        ALIGN_CENTER,
        TEXT_BOLD_ON,
        TEXT_BOLD_OFF,
        ALIGN_LEFT,
        instructions,
        ALIGN_CENTER,
        divider,
        footer,
        PAPER_FEED,
      ]);

      await writeInChunks(characteristic, payload, 100);

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

  const handleOrderPrint = () => {
    
  }

  if (mode === "print_qr") {
    return (
      <div>
        {!device ? (
          <Button onClick={connectPrinter} className="bg-red-700 text-white">
            {loading && <Spinner />} Connect Printer
          </Button>
        ) : (
          <Button
            onClick={() => handleQrPrint(qr_object)}
            disabled={loading || isDisabled}
            className="bg-green-900 text-white hover:bg-green-700"
          >
            {loading ? <Spinner /> : <Printer />} {text}
          </Button>
        )}
      </div>
    );
  }

  return <>You misconfigured this component if you saw this.</>;
}